from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=8)


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_username: str
    display_name: str
    role: str


class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    total_products: int
    available_products: int
    reserved_products: int
    sold_products: int
    total_orders: int
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    recent_registrations_7d: int
    recent_orders_7d: int


class AdminUserView(BaseModel):
    register_number: str
    username: str
    full_name: str
    university: str
    college: str
    department: str
    official_email: str
    personal_mail_id: Optional[str] = None
    phone_number: Optional[str] = None
    is_suspended: bool
    is_deleted: bool
    created_at: Optional[datetime] = None
    total_products: int
    total_orders_as_buyer: int
    total_orders_as_seller: int

    class Config:
        from_attributes = True


class SuspendUserRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class AdminUserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    personal_mail_id: Optional[str] = None
    phone_number: Optional[str] = None


class AdminProductStatusUpdate(BaseModel):
    product_status: str = Field(..., pattern="^(AVAILABLE|RESERVED|SOLD_OUT|REMOVED)$")
    reason: Optional[str] = Field(None, max_length=500)


class AdminOrderStatusOverride(BaseModel):
    order_status: str = Field(..., pattern="^(PENDING|CONFIRMED|IN_DELIVERY|COMPLETED|CANCELLED)$")
    reason: str = Field(..., min_length=5, max_length=500)


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditLogView(BaseModel):
    id: int
    admin_username: str
    action: str
    target_type: str
    target_id: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
