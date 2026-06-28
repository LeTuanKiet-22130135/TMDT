"""add WALLET to payment_method_enum

Revision ID: ab378f7aa622
Revises: 9f9cc77a8a40
Create Date: 2026-06-28 14:10:29.535458
"""
from alembic import op
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = 'ab378f7aa622'
down_revision = '9f9cc77a8a40'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE payment_method_enum ADD VALUE IF NOT EXISTS 'WALLET'")


def downgrade() -> None:
    pass
