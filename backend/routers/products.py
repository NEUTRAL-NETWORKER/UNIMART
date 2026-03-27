from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from database import get_db
from models import Product, UserProfile, OfficialRecord, ProductStatus
from schemas import ProductCreate, ProductUpdate, ProductResponse
from dependencies import get_current_user
from typing import Optional
import json

router = APIRouter(prefix="/products", tags=["Products"])


def _format_product(p, seller=None, official=None):
    """Format a product dict with seller info."""
    image_urls = []
    if p.image_urls:
        try:
            image_urls = json.loads(p.image_urls)
        except (json.JSONDecodeError, TypeError):
            image_urls = [p.image_urls] if p.image_urls else []

    return {
        "id": p.id,
        "seller_register_number": p.seller_register_number,
        "title": p.title,
        "description": p.description,
        "price": p.price,
        "category": p.category,
        "image_urls": image_urls,
        "image_url": image_urls[0] if image_urls else None,  # Backward compat
        "product_status": p.product_status,
        "created_at": str(p.created_at) if p.created_at else None,
        "seller_username": seller.username if seller else None,
        "seller_college": official.college if official else None,
        "seller_department": official.department if official else None,
    }


# ============================================================
# GET /products — List all products (with optional filters)
# ============================================================

@router.get("/")
def get_all_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all available products with optional filters."""
    query = db.query(Product).options(
        joinedload(Product.seller).joinedload(UserProfile.official_record)
    ).filter(Product.product_status == ProductStatus.AVAILABLE)

    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_term),
                Product.description.ilike(search_term),
                Product.category.ilike(search_term),
            )
        )

    products = query.order_by(Product.created_at.desc()).all()

    return [
        _format_product(p, p.seller, p.seller.official_record if p.seller else None)
        for p in products
    ]


# ============================================================
# GET /products/my — Get current user's products
# ============================================================

@router.get("/my")
def get_my_products(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all products listed by the current user."""
    products = db.query(Product).options(
        joinedload(Product.seller).joinedload(UserProfile.official_record)
    ).filter(
        Product.seller_register_number == current_user.register_number
    ).order_by(Product.created_at.desc()).all()

    return [
        _format_product(p, p.seller, p.seller.official_record if p.seller else None)
        for p in products
    ]


# ============================================================
# GET /products/search — Search products
# ============================================================

@router.get("/search")
def search_products(q: str = Query(...), db: Session = Depends(get_db)):
    """Search products by title or description."""
    # Sanitize search wildcards
    safe_q = q.replace("%", "\\%").replace("_", "\\_")

    products = db.query(Product).options(
        joinedload(Product.seller)
    ).filter(
        Product.product_status == ProductStatus.AVAILABLE,
        or_(
            Product.title.ilike(f"%{safe_q}%"),
            Product.description.ilike(f"%{safe_q}%")
        )
    ).order_by(Product.created_at.desc()).all()

    return [
        _format_product(p, p.seller, None)
        for p in products
    ]


# ============================================================
# GET /products/{id} — Get single product
# ============================================================

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product by ID."""
    product = db.query(Product).options(
        joinedload(Product.seller).joinedload(UserProfile.official_record)
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return _format_product(
        product,
        product.seller,
        product.seller.official_record if product.seller else None
    )


# ============================================================
# POST /products — Create a product listing
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new product listing. Only authenticated users can sell."""
    # Serialize image URLs to JSON
    image_urls_json = None
    if data.image_urls:
        image_urls_json = json.dumps(data.image_urls)
    elif data.image_url:
        image_urls_json = json.dumps([data.image_url])

    new_product = Product(
        seller_register_number=current_user.register_number,
        title=data.title,
        description=data.description,
        price=data.price,
        category=data.category,
        image_urls=image_urls_json,
        product_status=ProductStatus.AVAILABLE,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return _format_product(new_product)


# ============================================================
# PUT /products/{id} — Update a product (owner only)
# ============================================================

@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a product listing. Only the seller can update their own product."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own products")

    if data.title is not None:
        product.title = data.title
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price
    if data.category is not None:
        product.category = data.category
    if data.image_urls is not None:
        product.image_urls = json.dumps(data.image_urls)
    elif data.image_url is not None:
        product.image_urls = json.dumps([data.image_url])

    db.commit()
    db.refresh(product)

    return _format_product(product)


# ============================================================
# DELETE /products/{id} — Delete a product (owner only)
# ============================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a product listing. Only the seller can delete their own product."""
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.seller_register_number != current_user.register_number:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own products")

    # Safety check: prevent deletion if product has active orders
    from models import Order, OrderStatus
    active_orders = db.query(Order).filter(
        Order.product_id == product_id,
        Order.order_status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED])
    ).first()

    if active_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete product with active orders. Please complete or cancel existing orders first."
        )

    db.delete(product)
    db.commit()

    return {"success": True}
