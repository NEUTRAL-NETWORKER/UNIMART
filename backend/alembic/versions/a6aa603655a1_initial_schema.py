"""Initial schema

Revision ID: a6aa603655a1
Revises: 
Create Date: 2026-03-06 16:22:17.128111

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6aa603655a1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    if "official_records" not in existing:
        op.create_table(
            "official_records",
            sa.Column("register_number", sa.String(), primary_key=True, nullable=False),
            sa.Column("full_name", sa.String(), nullable=False),
            sa.Column("university", sa.String(), nullable=False),
            sa.Column("college", sa.String(), nullable=False),
            sa.Column("department", sa.String(), nullable=False),
            sa.Column("official_email", sa.String(), nullable=False),
        )
        op.create_index("ix_official_records_register_number", "official_records", ["register_number"])

    if "user_profiles" not in existing:
        op.create_table(
            "user_profiles",
            sa.Column("register_number", sa.String(), sa.ForeignKey("official_records.register_number"), primary_key=True, nullable=False),
            sa.Column("username", sa.String(), nullable=False, unique=True),
            sa.Column("hashed_password", sa.String(), nullable=False),
            sa.Column("profile_picture_url", sa.String(), nullable=True),
            sa.Column("personal_mail_id", sa.String(), nullable=False),
            sa.Column("phone_number", sa.String(), nullable=True),
            sa.Column("username_change_count", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("is_suspended", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("deletion_note", sa.String(length=500), nullable=True),
        )
        op.create_index("ix_user_profiles_register_number", "user_profiles", ["register_number"])
        op.create_index("ix_user_profiles_username", "user_profiles", ["username"])

    if "products" not in existing:
        op.create_table(
            "products",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("seller_register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("price", sa.Float(), nullable=False),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("image_urls", sa.Text(), nullable=True),
            sa.Column("product_status", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("sold_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("is_flagged", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        )

    if "orders" not in existing:
        op.create_table(
            "orders",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
            sa.Column("buyer_register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("seller_register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("order_status", sa.String(), nullable=True),
            sa.Column("otp_code", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("cancelled_by", sa.String(), nullable=True),
            sa.Column("cancellation_reason", sa.Text(), nullable=True),
        )

    if "chat_messages" not in existing:
        op.create_table(
            "chat_messages",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
            sa.Column("sender_register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        )

    if "product_images" not in existing:
        op.create_table(
            "product_images",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
            sa.Column("url", sa.String(length=1024), nullable=False),
            sa.Column("position", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        )

    if "user_activity_logs" not in existing:
        op.create_table(
            "user_activity_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("username", sa.String(), nullable=True),
            sa.Column("action", sa.String(length=80), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        )
        op.create_index("ix_user_activity_logs_register_number", "user_activity_logs", ["register_number"])

    if "notifications" not in existing:
        op.create_table(
            "notifications",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_register_number", sa.String(), sa.ForeignKey("user_profiles.register_number"), nullable=False),
            sa.Column("type", sa.String(length=50), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=True),
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        )
        op.create_index("ix_notifications_user_register_number", "notifications", ["user_register_number"])

    if "admin_accounts" not in existing:
        op.create_table(
            "admin_accounts",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("username", sa.String(length=50), nullable=False, unique=True),
            sa.Column("hashed_password", sa.String(length=255), nullable=False),
            sa.Column("display_name", sa.String(length=100), nullable=False),
            sa.Column("role", sa.String(length=50), nullable=False, server_default=sa.text("'super_admin'")),
            sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
            sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        )
        op.create_index("ix_admin_accounts_username", "admin_accounts", ["username"])

    if "admin_audit_logs" not in existing:
        op.create_table(
            "admin_audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admin_accounts.id"), nullable=False),
            sa.Column("admin_username", sa.String(length=50), nullable=False),
            sa.Column("action", sa.String(length=80), nullable=False),
            sa.Column("target_type", sa.String(length=50), nullable=False),
            sa.Column("target_id", sa.String(length=100), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(length=45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = set(inspector.get_table_names())

    # Drop tables in dependency order
    for table_name in [
        "admin_audit_logs",
        "admin_accounts",
        "notifications",
        "user_activity_logs",
        "product_images",
        "chat_messages",
        "orders",
        "products",
        "user_profiles",
        "official_records",
    ]:
        if table_name in existing:
            op.drop_table(table_name)
