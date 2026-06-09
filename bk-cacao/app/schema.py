import strawberry
from typing import List, Optional
from sqlalchemy.orm import Session
from app import models, database
from app.agent import ask_agent, extract_search_query
from app.vector_store import add_product_to_vector_store, search_similar_product_ids

async def get_context():
    db = database.SessionLocal()
    try:
        yield {"db": db}
    finally:
        db.close()

@strawberry.type
class ProductType:
    id: int
    name: str
    price: float
    description: Optional[str]

@strawberry.type
class Query:
    @strawberry.field
    def hello(self) -> str:
        return "Hello World"

    @strawberry.field
    def get_products(self, info: strawberry.Info) -> List[ProductType]:
        db: Session = info.context["db"]
        products = db.query(models.Product).all()
        return [ProductType(id=p.id, name=p.name, price=p.price, description=p.description) for p in products]

    @strawberry.field
    def search_products_by_ai(self, info: strawberry.Info, prompt: str) -> List[ProductType]:
        """
        API này dùng LLM để trích xuất tham số từ prompt tiếng Anh,
        sau đó truy vấn Database. Thay vì dùng ilike, nó dùng Similar Search (FAISS).
        """
        search_params = extract_search_query(prompt)
        
        db: Session = info.context["db"]
        query = db.query(models.Product)
        
        # Nếu LLM tìm ra keyword về tên sản phẩm, dùng Semantic Search
        if search_params.name:
            similar_ids = search_similar_product_ids(search_params.name, k=5)
            if not similar_ids:
                return []
            query = query.filter(models.Product.id.in_(similar_ids))
            
        if search_params.min_price is not None:
            query = query.filter(models.Product.price >= search_params.min_price)
        if search_params.max_price is not None:
            query = query.filter(models.Product.price <= search_params.max_price)
            
        products = query.all()
        return [ProductType(id=p.id, name=p.name, price=p.price, description=p.description) for p in products]

@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_product(self, info: strawberry.Info, name: str, description: str, price: float = 0.0) -> ProductType:
        db: Session = info.context["db"]
        new_product = models.Product(name=name, description=description, price=price)
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        # Thêm vào Vector Store để tìm kiếm sau này
        add_product_to_vector_store(new_product.id, new_product.name, new_product.description)
        
        return ProductType(id=new_product.id, name=new_product.name, price=new_product.price, description=new_product.description)

    @strawberry.mutation
    def ask_ai(self, prompt: str) -> str:
        return ask_agent(prompt)

schema = strawberry.Schema(query=Query, mutation=Mutation)
