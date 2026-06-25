from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import declarative_base

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
