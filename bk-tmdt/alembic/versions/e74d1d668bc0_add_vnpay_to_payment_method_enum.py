"""add VNPAY to payment method enum

Revision ID: e74d1d668bc0
Revises: dd81cb8657a0
Create Date: 2026-06-25 18:00:25.409153
"""
from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = 'e74d1d668bc0'
down_revision = 'dd81cb8657a0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Alembic autogenerate cannot detect PG enum value additions — manual SQL required
    op.execute("ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'VNPAY'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values directly.
    # To fully downgrade, you would need to recreate the enum type without VNPAY.
    # For development purposes, this is left as a no-op.
    pass
