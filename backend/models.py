from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Enum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


# ============================================================
# ENUMS
# ============================================================

class ProductStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    SOLD_OUT = "SOLD_OUT"
    DELETED = "DELETED"  # Soft-delete status


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# ============================================================
# PHASE 1: Official Record (Read-Only Master Registry)
# ============================================================

class OfficialRecord(Base):
    __tablename__ = "official_records"

    register_number = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    university = Column(String, nullable=False)
    college = Column(String, nullable=False)
    department = Column(String, nullable=False)
    official_email = Column(String, nullable=False)

    # Relationship to user profile
    user_profile = relationship("UserProfile", back_populates="official_record", uselist=False)


# ============================================================
# PHASE 1: User Profile (Read/Write)
# ============================================================

class UserProfile(Base):
    __tablename__ = "user_profiles"

    register_number = Column(String, ForeignKey("official_records.register_number"), primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    profile_picture_url = Column(String, nullable=True)
    personal_mail_id = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    username_change_count = Column(Integer, default=0)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    is_suspended   = Column(Boolean, default=False, nullable=False)
    is_deleted     = Column(Boolean, default=False, nullable=False)
    deleted_at     = Column(DateTime(timezone=True), nullable=True)
    deletion_note  = Column(String(500), nullable=True)

    # Relationships
    official_record = relationship("OfficialRecord", back_populates="user_profile")
    products = relationship("Product", back_populates="seller")
    buyer_orders = relationship("Order", foreign_keys="Order.buyer_register_number", back_populates="buyer")
    seller_orders = relationship("Order", foreign_keys="Order.seller_register_number", back_populates="seller")


# ============================================================
# PHASE 2: Product
# ============================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=True)
    image_urls = Column(Text, nullable=True)  # JSON array of image URLs (supports multiple images)
    product_status = Column(String, default=ProductStatus.AVAILABLE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    sold_at = Column(DateTime(timezone=True), nullable=True)
    is_flagged = Column(Boolean, default=False, nullable=False)

    # Relationships
    seller = relationship("UserProfile", back_populates="products")
    orders = relationship("Order", back_populates="product")
    product_images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.position")


# ============================================================
# PHASE 3: Order
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    buyer_register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False)
    seller_register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False)
    order_status = Column(String, default=OrderStatus.PENDING)
    otp_code = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(String, nullable=True)  # 'buyer' or 'seller'
    cancellation_reason = Column(Text, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="orders")
    buyer = relationship("UserProfile", foreign_keys=[buyer_register_number], back_populates="buyer_orders")
    seller = relationship("UserProfile", foreign_keys=[seller_register_number], back_populates="seller_orders")
    messages = relationship("ChatMessage", back_populates="order", cascade="all, delete-orphan")


# ============================================================
# PHASE 3: Chat Message
# ============================================================

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    sender_register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False)
    message = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="messages")


# ============================================================
# Product Images
# ============================================================

class ProductImage(Base):
    __tablename__ = "product_images"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    url        = Column(String(1024), nullable=False)
    position   = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product    = relationship("Product", back_populates="product_images")


# ============================================================
# User Activity Log (tracks login, registration, order events)
# ============================================================

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False, index=True)
    username        = Column(String, nullable=True)
    action          = Column(String(80), nullable=False)
    details         = Column(Text, nullable=True)
    ip_address      = Column(String(45), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


# ============================================================
# Notification (in-app notifications for users)
# ============================================================

class NotificationType(str, enum.Enum):
    ORDER_PLACED = "ORDER_PLACED"           # Seller receives when buyer places order
    ORDER_CONFIRMED = "ORDER_CONFIRMED"     # Buyer receives when seller confirms
    ORDER_CANCELLED = "ORDER_CANCELLED"     # Both receive on cancellation
    OTP_SENT = "OTP_SENT"                   # Buyer receives when seller sends OTP
    ORDER_COMPLETED = "ORDER_COMPLETED"     # Both receive on completion
    SYSTEM = "SYSTEM"                       # System notifications


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_register_number = Column(String, ForeignKey("user_profiles.register_number"), nullable=False, index=True)
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("UserProfile", backref="notifications")

