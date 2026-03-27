"""Backfill missing schema objects

Revision ID: c1b9f7a2d8e4
Revises: a6aa603655a1
Create Date: 2026-03-26 22:10:00.000000

"""
from typing import Sequence, Union

from alembic import op

# Import metadata and model modules so create_all knows all tables.
from database import Base
import models  # noqa: F401
import admin_models  # noqa: F401


# revision identifiers, used by Alembic.
revision: str = "c1b9f7a2d8e4"
down_revision: Union[str, Sequence[str], None] = "a6aa603655a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create any missing tables/indexes in a safe, idempotent way."""
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind, checkfirst=True)


def downgrade() -> None:
    """No-op downgrade to avoid accidental destructive drops in existing environments."""
    pass
