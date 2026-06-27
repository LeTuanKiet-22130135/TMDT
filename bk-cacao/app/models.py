from uuid import uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, String, Float, Boolean, DateTime, Index, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True)
    store_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    image_urls = Column(JSONB, nullable=False, default=list)
    user_tags = Column(JSONB, nullable=False, default=list)
    ai_tags = Column(JSONB, nullable=False, default=list)
    license_type = Column(String, nullable=False)
    software_tags = Column(JSONB, nullable=False, default=list)
    format_tags = Column(JSONB, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True))


class Store(Base):
    __tablename__ = "stores"
    id = Column(UUID(as_uuid=True), primary_key=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False)


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True)
    full_name = Column(String, nullable=False)
    avatar_url = Column(Text, nullable=True)
    shortlink = Column(String(32), nullable=True)


class UserRedProfile(Base):
    """User recommendation profile — stores weighted tag interest vector and dampening log."""
    __tablename__ = "user_red_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    # {tag: accumulated_weight}
    tag_weights = Column(JSONB, nullable=False, default=dict)
    # {product_id: {event_type: count}} — tracks how many times each event fired per product
    event_log = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


EMBEDDING_DIM = 384  # intfloat/multilingual-e5-small output dims


class ProductRedProfile(Base):
    """Product recommendation profile — tag vector + pgvector semantic embedding."""
    __tablename__ = "product_red_profile"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    product_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    # {tag: normalized_tf_score} — for content-based filtering
    tag_vector = Column(JSONB, nullable=False, default=dict)
    # pgvector VECTOR(384) — cosine similarity via <=> operator (HNSW index managed in lifespan)
    embedding = Column(Vector(EMBEDDING_DIM), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
