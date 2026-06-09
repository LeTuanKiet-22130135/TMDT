import os
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_ollama import ChatOllama
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from langgraph.prebuilt import create_react_agent
from app.database import SessionLocal
from app.models import Product

load_dotenv(".env.test")

ollama_base_url = os.getenv("OLLAMA_API", "http://localhost:11434")
ollama_model = os.getenv("MODEL", "llama3")
ollama_api_key = os.getenv("OLLAMA_API_KEY", None)

client_kwargs = {}
if ollama_api_key:
    client_kwargs["headers"] = {"Authorization": f"Bearer {ollama_api_key}"}

llm = ChatOllama(
    base_url=ollama_base_url,
    model=ollama_model,
    client_kwargs=client_kwargs if client_kwargs else None,
)

# ----------------- PHẦN 1: Tool Calling Agent (Cũ) -----------------
@tool
def search_products(keyword: str) -> str:
    """
    Sử dụng công cụ này để tìm kiếm thông tin về sản phẩm trong cơ sở dữ liệu dựa trên từ khóa.
    Tham số `keyword` là tên sản phẩm cần tìm.
    Trả về thông tin dạng chuỗi của các sản phẩm trùng khớp.
    """
    db = SessionLocal()
    try:
        products = db.query(Product).filter(Product.name.ilike(f"%{keyword}%")).all()
        if not products:
            return "Không tìm thấy sản phẩm nào phù hợp với từ khóa này."
        
        result = "Các sản phẩm tìm thấy:\n"
        for p in products:
            result += f"- ID: {p.id}, Tên: {p.name}, Giá: {p.price}, Mô tả: {p.description}\n"
        return result
    except Exception as e:
        return f"Lỗi truy vấn cơ sở dữ liệu: {str(e)}"
    finally:
        db.close()

tools = [search_products]

# Thay thế AgentExecutor (bị xóa ở bản mới) bằng LangGraph create_react_agent
agent_executor = create_react_agent(llm, tools)

def ask_agent(user_prompt: str) -> str:
    try:
        messages = [{"role": "user", "content": user_prompt}]
        response = agent_executor.invoke({"messages": messages})
        return response["messages"][-1].content
    except Exception as e:
        print(f"Agent error: {e}")
        return f"Agent Error: {str(e)}"

# ----------------- PHẦN 2: Query Extraction API (Mới) -----------------
class ProductSearchQuery(BaseModel):
    """Search parameters extracted from user query."""
    name: Optional[str] = Field(default=None, description="The name or keyword of the product to search for. Leave null if not specified.")
    min_price: Optional[float] = Field(default=None, description="The minimum price of the product. Leave null if not specified.")
    max_price: Optional[float] = Field(default=None, description="The maximum price of the product. Leave null if not specified.")

def extract_search_query(user_prompt: str) -> ProductSearchQuery:
    """
    Extract search parameters from an English user prompt.
    """
    extraction_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert data extraction assistant. Extract search parameters for products based on the user's input. The parameters include 'name', 'min_price', and 'max_price'. If a parameter is not mentioned, leave it null."),
        ("human", "{input}")
    ])
    structured_llm = llm.with_structured_output(ProductSearchQuery)
    chain = extraction_prompt | structured_llm
    
    try:
        result = chain.invoke({"input": user_prompt})
        print(result)
        return result
    except Exception as e:
        print(f"Extraction error: {e}")
        return ProductSearchQuery()
