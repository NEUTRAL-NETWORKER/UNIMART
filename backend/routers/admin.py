"""
Admin router for Unimart — DB-backed admin auth + full management endpoints.
All state-mutating endpoints are protected by get_current_admin and produce audit logs.
"""
import json
import math
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from admin_auth import create_admin_token, get_current_admin, seed_super_admin, bcrypt_context
from admin_models import AdminAccount, AdminAuditLog
from admin_schemas import (
    AdminLoginRequest, AdminTokenResponse, DashboardStats,
    AdminUserView, SuspendUserRequest, AdminUserUpdate,
    AdminProductStatusUpdate, AdminOrderStatusOverride,
    PaginatedResponse, AuditLogView,
)
from database import get_db
from middleware.rate_limit import rate_limit_strict
from models import OfficialRecord, UserProfile, Product, Order

router = APIRouter(prefix="/admin", tags=["Admin"])

_STRICT = [Depends(rate_limit_strict(5, 60))]


# ─────────────────────────────────────────────────────────────
# Helper: write an audit log entry
# ─────────────────────────────────────────────────────────────

def _log(
    db: Session,
    admin: AdminAccount,
    action: str,
    target_type: str,
    target_id: str,
    details: Optional[dict] = None,
    request: Optional[Request] = None,
) -> None:
    ip = None
    if request:
        ip = request.headers.get("X-Forwarded-For", "")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else None
    db.add(AdminAuditLog(
        admin_id=admin.id,
        admin_username=admin.username,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details=json.dumps(details) if details else None,
        ip_address=ip,
    ))
    db.commit()


def _paginate(query, page: int, page_size: int):
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, math.ceil(total / page_size))
    return items, total, total_pages


# ─────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=AdminTokenResponse, dependencies=_STRICT)
def admin_login(data: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    admin = db.query(AdminAccount).filter_by(username=data.username, is_active=True).first()
    if not admin or not bcrypt_context.verify(data.password, admin.hashed_password):
        raise HTTPException(401, "Invalid admin credentials")
    admin.last_login = datetime.now(timezone.utc)
    db.commit()
    _log(db, admin, "ADMIN_LOGIN", "admin", str(admin.id), request=request)
    token = create_admin_token(admin)
    return AdminTokenResponse(
        access_token=token,
        admin_username=admin.username,
        display_name=admin.display_name,
        role=admin.role,
    )


@router.get("/auth/me")
def admin_me(admin: AdminAccount = Depends(get_current_admin)):
    return {
        "id": admin.id,
        "username": admin.username,
        "display_name": admin.display_name,
        "role": admin.role,
        "last_login": admin.last_login,
    }


# ─────────────────────────────────────────────────────────────
# DASHBOARD
# ─────────────────────────────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats)
def dashboard_stats(
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    total_users = db.query(UserProfile).filter_by(is_deleted=False).count()
    suspended_users = db.query(UserProfile).filter_by(is_suspended=True, is_deleted=False).count()
    active_users = total_users - suspended_users

    total_products = db.query(Product).count()
    available_products = db.query(Product).filter_by(product_status="AVAILABLE").count()
    reserved_products = db.query(Product).filter_by(product_status="RESERVED").count()
    sold_products = db.query(Product).filter_by(product_status="SOLD_OUT").count()

    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter_by(order_status="PENDING").count()
    completed_orders = db.query(Order).filter_by(order_status="COMPLETED").count()
    cancelled_orders = db.query(Order).filter_by(order_status="CANCELLED").count()

    recent_registrations_7d = db.query(UserProfile).filter(
        UserProfile.created_at >= week_ago
    ).count()
    recent_orders_7d = db.query(Order).filter(Order.created_at >= week_ago).count()

    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        suspended_users=suspended_users,
        total_products=total_products,
        available_products=available_products,
        reserved_products=reserved_products,
        sold_products=sold_products,
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        recent_registrations_7d=recent_registrations_7d,
        recent_orders_7d=recent_orders_7d,
    )


# ─────────────────────────────────────────────────────────────
# USERS
# ─────────────────────────────────────────────────────────────

def _user_view(u: UserProfile, db: Session) -> dict:
    official = db.query(OfficialRecord).filter_by(register_number=u.register_number).first()
    total_products = db.query(Product).filter_by(seller_register_number=u.register_number).count()
    total_buyer = db.query(Order).filter_by(buyer_register_number=u.register_number).count()
    total_seller = db.query(Order).filter_by(seller_register_number=u.register_number).count()
    return {
        "register_number": u.register_number,
        "username": u.username,
        "full_name": official.full_name if official else "",
        "university": official.university if official else "",
        "college": official.college if official else "",
        "department": official.department if official else "",
        "official_email": official.official_email if official else "",
        "personal_mail_id": u.personal_mail_id,
        "phone_number": u.phone_number,
        "is_suspended": u.is_suspended,
        "is_deleted": u.is_deleted,
        "created_at": u.created_at,
        "total_products": total_products,
        "total_orders_as_buyer": total_buyer,
        "total_orders_as_seller": total_seller,
    }


@router.get("/users")
def list_users(
    search: Optional[str] = None,
    suspended_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(UserProfile).filter_by(is_deleted=False)
    if suspended_only:
        query = query.filter_by(is_suspended=True)
    if search:
        like = f"%{search}%"
        query = query.filter(
            UserProfile.register_number.ilike(like) |
            UserProfile.username.ilike(like)
        )
    items, total, total_pages = _paginate(query, page, page_size)
    return PaginatedResponse(
        items=[_user_view(u, db) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{register_number}")
def get_user(
    register_number: str,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    return _user_view(user, db)


@router.patch("/users/{register_number}")
def update_user(
    register_number: str,
    data: AdminUserUpdate,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    before = {"username": user.username, "personal_mail_id": user.personal_mail_id, "phone_number": user.phone_number}
    if data.username:
        user.username = data.username
    if data.personal_mail_id is not None:
        user.personal_mail_id = data.personal_mail_id
    if data.phone_number is not None:
        user.phone_number = data.phone_number
    db.commit()
    after = {"username": user.username, "personal_mail_id": user.personal_mail_id, "phone_number": user.phone_number}
    _log(db, admin, "USER_UPDATE", "user", register_number, {"before": before, "after": after}, request)
    return {"updated": True, "register_number": register_number}


@router.post("/users/{register_number}/suspend")
def suspend_user(
    register_number: str,
    data: SuspendUserRequest,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_suspended:
        raise HTTPException(400, "User is already suspended")
    user.is_suspended = True
    db.commit()
    _log(db, admin, "USER_SUSPEND", "user", register_number, {"reason": data.reason}, request)
    return {"suspended": True, "register_number": register_number}


@router.post("/users/{register_number}/reinstate")
def reinstate_user(
    register_number: str,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.is_suspended:
        raise HTTPException(400, "User is not suspended")
    user.is_suspended = False
    db.commit()
    _log(db, admin, "USER_REINSTATE", "user", register_number, request=request)
    return {"reinstated": True, "register_number": register_number}


@router.delete("/users/{register_number}")
def delete_user(
    register_number: str,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    user = db.query(UserProfile).filter_by(register_number=register_number.upper()).first()
    if not user:
        raise HTTPException(404, "User not found")
    user.is_deleted = True
    user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    _log(db, admin, "USER_DELETE", "user", register_number, request=request)
    return {"deleted": True, "register_number": register_number}


# ─────────────────────────────────────────────────────────────
# PRODUCTS
# ─────────────────────────────────────────────────────────────

def _product_view(p: Product, db: Session) -> dict:
    seller = db.query(UserProfile).filter_by(register_number=p.seller_register_number).first()
    return {
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "price": p.price,
        "category": p.category,
        "product_status": p.product_status,
        "is_flagged": p.is_flagged,
        "image_urls": p.image_urls if p.image_urls else [],
        "seller_register_number": p.seller_register_number,
        "seller_username": seller.username if seller else None,
        "created_at": p.created_at,
        "sold_at": p.sold_at,
    }


@router.get("/products")
def list_products(
    search: Optional[str] = None,
    status: Optional[str] = None,
    flagged_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Product)
    if status:
        query = query.filter(Product.product_status == status)
    if flagged_only:
        query = query.filter_by(is_flagged=True)
    if search:
        like = f"%{search}%"
        query = query.filter(Product.title.ilike(like) | Product.description.ilike(like))
    items, total, total_pages = _paginate(query, page, page_size)
    return PaginatedResponse(
        items=[_product_view(p, db) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/products/{product_id}")
def get_product(
    product_id: int,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    return _product_view(product, db)


@router.patch("/products/{product_id}/status")
def update_product_status(
    product_id: int,
    data: AdminProductStatusUpdate,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    before_status = product.product_status
    product.product_status = data.product_status
    db.commit()
    _log(db, admin, "PRODUCT_STATUS_CHANGE", "product", str(product_id),
         {"before": before_status, "after": data.product_status, "reason": data.reason}, request)
    return {"updated": True, "product_id": product_id, "product_status": data.product_status}


@router.post("/products/{product_id}/flag")
def flag_product(
    product_id: int,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    product.is_flagged = True
    db.commit()
    _log(db, admin, "PRODUCT_FLAG", "product", str(product_id), request=request)
    return {"flagged": True, "product_id": product_id}


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter_by(id=product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")

    # First delete all orders and chat messages associated with this product (to avoid FK constraint)
    from models import ChatMessage
    orders = db.query(Order).filter_by(product_id=product_id).all()
    orders_deleted = len(orders)
    for order in orders:
        # Delete chat messages for this order first
        db.query(ChatMessage).filter_by(order_id=order.id).delete()
        db.delete(order)

    db.delete(product)
    db.commit()
    _log(db, admin, "PRODUCT_DELETE", "product", str(product_id),
         {"orders_deleted": orders_deleted}, request=request)
    return {"deleted": True, "product_id": product_id, "orders_deleted": orders_deleted}


# ─────────────────────────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────────────────────────

def _order_view(o: Order, db: Session) -> dict:
    product = db.query(Product).filter_by(id=o.product_id).first()
    return {
        "id": o.id,
        "product_id": o.product_id,
        "product_title": product.title if product else None,
        "buyer_register_number": o.buyer_register_number,
        "seller_register_number": o.seller_register_number,
        "order_status": o.order_status,
        "created_at": o.created_at,
        "completed_at": o.completed_at,
    }


@router.get("/orders")
def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.order_status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            Order.buyer_register_number.ilike(like) |
            Order.seller_register_number.ilike(like)
        )
    items, total, total_pages = _paginate(query, page, page_size)
    return PaginatedResponse(
        items=[_order_view(o, db) for o in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/orders/{order_id}")
def get_order(
    order_id: int,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    return _order_view(order, db)


@router.patch("/orders/{order_id}/status")
def override_order_status(
    order_id: int,
    data: AdminOrderStatusOverride,
    request: Request,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter_by(id=order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    before_status = order.order_status
    order.order_status = data.order_status
    if data.order_status == "COMPLETED" and not order.completed_at:
        order.completed_at = datetime.now(timezone.utc)
    db.commit()
    _log(db, admin, "ORDER_STATUS_OVERRIDE", "order", str(order_id),
         {"before": before_status, "after": data.order_status, "reason": data.reason}, request)
    return {"updated": True, "order_id": order_id, "order_status": data.order_status}


# ─────────────────────────────────────────────────────────────
# AUDIT LOGS
# ─────────────────────────────────────────────────────────────

@router.get("/audit-logs")
def list_audit_logs(
    action: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    query = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc())
    if action:
        query = query.filter(AdminAuditLog.action == action)
    items, total, total_pages = _paginate(query, page, page_size)
    return PaginatedResponse(
        items=[AuditLogView.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ─────────────────────────────────────────────────────────────
# USER ACTIVITY LOGS
# ─────────────────────────────────────────────────────────────

@router.get("/user-activity-logs")
def get_user_activity_logs(
    page: int = 1,
    page_size: int = 20,
    admin: AdminAccount = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    from models import UserActivityLog
    query = db.query(UserActivityLog).order_by(UserActivityLog.created_at.desc())
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [
            {
                "id": l.id,
                "register_number": l.register_number,
                "username": l.username,
                "action": l.action,
                "details": l.details,
                "ip_address": l.ip_address,
                "created_at": l.created_at,
            }
            for l in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, math.ceil(total / page_size)),
    }

