from app.database import SessionLocal, engine, Base
from app.models import Product
from app.vector_store import add_product_to_vector_store, reset_vector_store

def seed_data():
    # Khởi tạo lại bảng và Vector Store
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    reset_vector_store()
    
    db = SessionLocal()
    
    products = [
        Product(name="T-Shirt", description="Blue cotton shirt", price=20.0),
        Product(name="Jeans", description="Blue denim jeans", price=50.0),
        Product(name="Leather Jacket", description="Black leather jacket", price=120.0),
        Product(name="Sneakers", description="White running shoes", price=80.0),
        Product(name="Sun Hat", description="Wide brim sun hat", price=15.0),
        Product(name="Winter Coat", description="Thick winter coat", price=150.0),
        Product(name="Socks", description="Woolen socks", price=5.0),
    ]
    
    db.add_all(products)
    db.commit()
    
    for p in products:
        db.refresh(p)
        add_product_to_vector_store(p.id, p.name, p.description)
        
    print("Database and Vector Store seeded successfully with 7 products!")
    db.close()

if __name__ == "__main__":
    seed_data()
