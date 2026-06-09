from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Product(Base):
    """
    Model sản phẩm để lưu trữ trong database
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, index=True)
    price = Column(Float, default=0.0)
