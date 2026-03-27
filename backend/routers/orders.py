from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Order, Product, UserProfile, OrderStatus, ProductStatus, NotificationType
from schemas import OrderCreate
from dependencies import get_current_user
from routers.notifications import create_notification

router = APIRouter(prefix="/orders", tags=["Orders"])


# ============================================================
# Schemas
# ============================================================

class OrderStatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None  # Cancellation reason


class OrderCancelRequest(BaseModel):
    reason: str


# ============================================================
# POST /orders — Create an order (buyer)
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Buyer creates an order for a product."""
    # Find the product
    product = db.query(Product).filter(Product.id == data.product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.product_status != ProductStatus.AVAILABLE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is no longer available")

    if product.seller_register_number == current_user.register_number:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot buy your own product")

    # Prevent duplicate active orders for the same product by same buyer
    existing_order = db.query(Order).filter(
        Order.product_id == data.product_id,
        Order.buyer_register_number == current_user.register_number,
        Order.order_status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])
    ).first()
    if existing_order:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already have an active order for this product")

    # Create the order
    new_order = Order(
        product_id=product.id,
        buyer_register_number=current_user.register_number,
        seller_register_number=product.seller_register_number,
        order_status=OrderStatus.PENDING,
    )
    db.add(new_order)

    # Reserve the product
    product.product_status = ProductStatus.RESERVED

    db.commit()
    db.refresh(new_order)

    # Send notification to seller
    create_notification(
        db=db,
        user_register_number=product.seller_register_number,
        notification_type=NotificationType.ORDER_PLACED,
        title="New Order Received! 🛒",
        message=f"{current_user.username} wants to buy your '{product.title}' for ₹{product.price}",
        order_id=new_order.id
    )

    return {
        "id": new_order.id,
        "product_id": new_order.product_id,
        "buyer_register_number": new_order.buyer_register_number,
        "seller_register_number": new_order.seller_register_number,
        "order_status": new_order.order_status,
        "created_at": str(new_order.created_at) if new_order.created_at else None,
    }


# ============================================================
# GET /orders/buyer — List buyer's orders
# ============================================================

@router.get("/buyer")
def get_buyer_orders(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders where the current user is the buyer."""
    orders = db.query(Order).filter(
        Order.buyer_register_number == current_user.register_number
    ).order_by(Order.created_at.desc()).all()

    return _format_orders(orders, db)


# ============================================================
# GET /orders/seller — List seller's orders
# ============================================================

@router.get("/seller")
def get_seller_orders(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all orders where the current user is the seller."""
    orders = db.query(Order).filter(
        Order.seller_register_number == current_user.register_number
    ).order_by(Order.created_at.desc()).all()

    return _format_orders(orders, db)


# ============================================================
# GET /orders/{id} — Get single order
# ============================================================

@router.get("/{order_id}")
def get_order(
    order_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single order. Only the buyer or seller can view it."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have access to this order")

    product = db.query(Product).filter(Product.id == order.product_id).first()
    buyer = db.query(UserProfile).filter(UserProfile.register_number == order.buyer_register_number).first()
    seller = db.query(UserProfile).filter(UserProfile.register_number == order.seller_register_number).first()

    return {
        "id": order.id,
        "product_id": order.product_id,
        "buyer_register_number": order.buyer_register_number,
        "seller_register_number": order.seller_register_number,
        "order_status": order.order_status,
        "created_at": str(order.created_at) if order.created_at else None,
        "completed_at": str(order.completed_at) if order.completed_at else None,
        "cancelled_at": str(order.cancelled_at) if order.cancelled_at else None,
        "cancelled_by": order.cancelled_by,
        "cancellation_reason": order.cancellation_reason,
        "product_title": product.title if product else None,
        "product_price": product.price if product else None,
        "product_image": product.image_urls if product else None,
        "buyer_username": buyer.username if buyer else None,
        "seller_username": seller.username if seller else None,
    }


# ============================================================
# PUT /orders/{id}/status — Update order status
# ============================================================

@router.put("/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update order status. Seller confirms, either party can cancel."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only involved parties can update
    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    new_status = data.status.upper()
    allowed_statuses = {
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.COMPLETED,
    }
    if new_status not in allowed_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid order status")

    if order.order_status in [OrderStatus.CANCELLED, OrderStatus.COMPLETED] and new_status != order.order_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update an order with status '{order.order_status}'"
        )

    if new_status == OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use OTP verification to complete the order"
        )

    product = db.query(Product).filter(Product.id == order.product_id).first()
    buyer = db.query(UserProfile).filter(UserProfile.register_number == order.buyer_register_number).first()
    seller = db.query(UserProfile).filter(UserProfile.register_number == order.seller_register_number).first()

    # Validate status transition
    if new_status == OrderStatus.CONFIRMED:
        if order.seller_register_number != current_user.register_number:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the seller can confirm an order")

        if order.order_status != OrderStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PENDING orders can be confirmed"
            )

        # Notify buyer that order is confirmed
        create_notification(
            db=db,
            user_register_number=order.buyer_register_number,
            notification_type=NotificationType.ORDER_CONFIRMED,
            title="Order Confirmed! ✅",
            message=f"{seller.username if seller else 'Seller'} confirmed your order for '{product.title if product else 'item'}'. You can now chat to arrange delivery!",
            order_id=order.id
        )

    if new_status == OrderStatus.CANCELLED:
        if order.order_status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order with status '{order.order_status}'"
            )

        # Release the product back to available
        if product and product.product_status in [ProductStatus.RESERVED, ProductStatus.SOLD_OUT]:
            product.product_status = ProductStatus.AVAILABLE

        # Determine who cancelled
        is_buyer = order.buyer_register_number == current_user.register_number
        order.cancelled_by = "buyer" if is_buyer else "seller"
        order.cancelled_at = func.now()
        order.cancellation_reason = data.reason

        # Notify the other party
        other_party = order.seller_register_number if is_buyer else order.buyer_register_number
        canceller_name = buyer.username if is_buyer else seller.username
        reason_text = f" Reason: {data.reason}" if data.reason else ""

        create_notification(
            db=db,
            user_register_number=other_party,
            notification_type=NotificationType.ORDER_CANCELLED,
            title="Order Cancelled ❌",
            message=f"{canceller_name} cancelled the order for '{product.title if product else 'item'}'.{reason_text}",
            order_id=order.id
        )

    order.order_status = new_status

    db.commit()
    db.refresh(order)

    return {"id": order.id, "status": order.order_status}


# ============================================================
# POST /orders/{id}/cancel — Cancel order with reason (buyer/seller)
# ============================================================

@router.post("/{order_id}/cancel")
def cancel_order_with_reason(
    order_id: int,
    data: OrderCancelRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel an order with a reason. Either buyer or seller can cancel."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only involved parties can cancel
    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Can only cancel PENDING or CONFIRMED orders
    if order.order_status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status '{order.order_status}'"
        )

    product = db.query(Product).filter(Product.id == order.product_id).first()
    buyer = db.query(UserProfile).filter(UserProfile.register_number == order.buyer_register_number).first()
    seller = db.query(UserProfile).filter(UserProfile.register_number == order.seller_register_number).first()

    # Release the product back to available
    if product and product.product_status in [ProductStatus.RESERVED, ProductStatus.SOLD_OUT]:
        product.product_status = ProductStatus.AVAILABLE

    # Determine who cancelled
    is_buyer = order.buyer_register_number == current_user.register_number
    order.cancelled_by = "buyer" if is_buyer else "seller"
    order.cancelled_at = func.now()
    order.cancellation_reason = data.reason
    order.order_status = OrderStatus.CANCELLED

    # Notify the other party
    other_party = order.seller_register_number if is_buyer else order.buyer_register_number
    canceller_name = buyer.username if is_buyer else seller.username

    create_notification(
        db=db,
        user_register_number=other_party,
        notification_type=NotificationType.ORDER_CANCELLED,
        title="Order Cancelled ❌",
        message=f"{canceller_name} cancelled the order for '{product.title if product else 'item'}'. Reason: {data.reason}",
        order_id=order.id
    )

    db.commit()
    db.refresh(order)

    return {
        "id": order.id,
        "status": order.order_status,
        "cancelled_by": order.cancelled_by,
        "cancellation_reason": order.cancellation_reason
    }


# ============================================================
# Helper function
# ============================================================

def _format_orders(orders, db):
    """Format a list of orders with product and user details."""
    result = []
    for o in orders:
        product = o.product if hasattr(o, 'product') and o.product else db.query(Product).filter(Product.id == o.product_id).first()
        buyer = o.buyer if hasattr(o, 'buyer') and o.buyer else db.query(UserProfile).filter(UserProfile.register_number == o.buyer_register_number).first()
        seller = o.seller if hasattr(o, 'seller') and o.seller else db.query(UserProfile).filter(UserProfile.register_number == o.seller_register_number).first()
        result.append({
            "id": o.id,
            "product_id": o.product_id,
            "buyer_register_number": o.buyer_register_number,
            "seller_register_number": o.seller_register_number,
            "order_status": o.order_status,
            "created_at": str(o.created_at) if o.created_at else None,
            "completed_at": str(o.completed_at) if o.completed_at else None,
            "cancelled_at": str(o.cancelled_at) if hasattr(o, 'cancelled_at') and o.cancelled_at else None,
            "cancelled_by": o.cancelled_by if hasattr(o, 'cancelled_by') else None,
            "cancellation_reason": o.cancellation_reason if hasattr(o, 'cancellation_reason') else None,
            "product_title": product.title if product else None,
            "product_price": product.price if product else None,
            "product_image": product.image_urls if product else None,
            "buyer_username": buyer.username if buyer else None,
            "seller_username": seller.username if seller else None,
        })
    return result
