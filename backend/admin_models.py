from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from database import Base


class AdminAccount(Base):
    __tablename__ = "admin_accounts"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    username        = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name    = Column(String(100), nullable=False)
    role            = Column(Enum("super_admin", name="admin_role_enum"), default="super_admin", nullable=False)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    last_login      = Column(DateTime(timezone=True), nullable=True)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    admin_id       = Column(Integer, ForeignKey("admin_accounts.id"), nullable=False)
    admin_username = Column(String(50), nullable=False)
    action         = Column(String(80), nullable=False)
    target_type    = Column(String(50), nullable=False)
    target_id      = Column(String(100), nullable=False)
    details        = Column(Text, nullable=True)
    ip_address     = Column(String(45), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
