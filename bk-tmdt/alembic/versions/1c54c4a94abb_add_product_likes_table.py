"""add product_likes table

Revision ID: 1c54c4a94abb
Revises: 00d94a6bb187
Create Date: 2026-06-27 14:37:21.528939
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '1c54c4a94abb'
down_revision = '00d94a6bb187'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('product_likes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('product_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'product_id', name='uq_product_likes_user_product')
    )


def downgrade() -> None:
    op.drop_table('product_likes')
