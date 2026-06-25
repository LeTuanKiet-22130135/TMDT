import os
from typing import Optional

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from pydantic import BaseModel, Field

from app.database import get_db
from app.models import Product

load_dotenv()

_OLLAMA_URL = os.getenv("OLLAMA_API", "http://localhost:11434")
_MODEL = os.getenv("MODEL", "llama3")
_API_KEY = os.getenv("OLLAMA_API_KEY")

_llm = None
_agent_executor = None


def _get_llm() -> ChatOllama:
    global _llm
    if _llm is None:
        kwargs = {"headers": {"Authorization": f"Bearer {_API_KEY}"}} if _API_KEY else {}
        _llm = ChatOllama(base_url=_OLLAMA_URL, model=_MODEL, client_kwargs=kwargs or None)
    return _llm


def _get_agent():
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = create_react_agent(_get_llm(), [search_products])
    return _agent_executor


@tool
def search_products(keyword: str) -> str:
    """Tìm kiếm sản phẩm trong cơ sở dữ liệu theo từ khóa tên."""
    with get_db() as db:
        products = db.query(Product).filter(
            Product.name.ilike(f"%{keyword}%"),
            Product.is_active == True,
        ).limit(10).all()

    if not products:
        return "Không tìm thấy sản phẩm nào phù hợp."

    lines = [f"- ID: {p.id}, Tên: {p.name}, Giá: {p.price}" for p in products]
    return "Sản phẩm tìm thấy:\n" + "\n".join(lines)


def ask_agent(user_prompt: str) -> str:
    try:
        response = _get_agent().invoke({"messages": [{"role": "user", "content": user_prompt}]})
        return response["messages"][-1].content
    except Exception as e:
        return f"Agent error: {e}"


class ProductSearchQuery(BaseModel):
    name: Optional[str] = Field(default=None, description="Product name/keyword to search for.")
    min_price: Optional[float] = Field(default=None, description="Minimum price filter.")
    max_price: Optional[float] = Field(default=None, description="Maximum price filter.")


def extract_search_query(user_prompt: str) -> ProductSearchQuery:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract product search parameters (name, min_price, max_price) from the user input. Leave fields null if not mentioned."),
        ("human", "{input}"),
    ])
    try:
        chain = prompt | _get_llm().with_structured_output(ProductSearchQuery)
        return chain.invoke({"input": user_prompt})
    except Exception as e:
        print(f"[extract_search_query] {e}")
        return ProductSearchQuery()
