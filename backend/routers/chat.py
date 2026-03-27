from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ChatMessage, Order, OrderStatus, UserProfile
from schemas import ChatMessageCreate
from dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


# ============================================================
# GET /chat/{orderId} — Get chat messages for an order
# ============================================================

@router.get("/{order_id}")
def get_messages(
    order_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages for an order's private chat."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only buyer and seller can access the chat
    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    messages = db.query(ChatMessage).filter(
        ChatMessage.order_id == order_id
    ).order_by(ChatMessage.sent_at.asc()).all()

    return [
        {
            "id": m.id,
            "orderId": m.order_id,
            "sender_register_number": m.sender_register_number,
            "message": m.message,
            "sent_at": str(m.sent_at) if m.sent_at else None,
        }
        for m in messages
    ]


# ============================================================
# POST /chat/{orderId} — Send a message
# ============================================================

@router.post("/{order_id}", status_code=status.HTTP_201_CREATED)
def send_message(
    order_id: int,
    data: ChatMessageCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in the private chat. Only works when order is CONFIRMED."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Only buyer and seller can chat
    if (order.buyer_register_number != current_user.register_number and
            order.seller_register_number != current_user.register_number):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Chat lifecycle: active when PENDING or CONFIRMED
    if order.order_status == OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This chat is read-only. The transaction has been completed."
        )

    if order.order_status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This chat is read-only. The order has been cancelled."
        )

    if order.order_status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat is not available for this order status."
        )

    new_message = ChatMessage(
        order_id=order_id,
        sender_register_number=current_user.register_number,
        message=data.message,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    return {
        "id": new_message.id,
        "orderId": new_message.order_id,
        "sender_register_number": new_message.sender_register_number,
        "message": new_message.message,
        "sent_at": str(new_message.sent_at) if new_message.sent_at else None,
    }
