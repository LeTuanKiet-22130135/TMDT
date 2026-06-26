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


def translate_to_english(text: str) -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Translate the Vietnamese product search keywords to English. Return ONLY the translated keywords, nothing else."),
        ("human", "{text}"),
    ])
    try:
        chain = prompt | _get_llm()
        result = chain.invoke({"text": text})
        translated = result.content.strip()
        print(f"[Shiro/translate] {text!r} → {translated!r}")
        return translated
    except Exception as e:
        print(f"[Shiro/translate] ERROR: {e}")
        return text


def ask_agent(user_prompt: str) -> str:
    print(f"\n{'='*60}")
    print(f"[Shiro] PROMPT: {user_prompt}")
    try:
        response = _get_agent().invoke({"messages": [{"role": "user", "content": user_prompt}]})
        for msg in response["messages"]:
            cls = type(msg).__name__
            if cls == "AIMessage":
                if getattr(msg, "tool_calls", None):
                    for tc in msg.tool_calls:
                        print(f"[Shiro] TOOL CALL → {tc['name']}({tc['args']})")
                elif msg.content:
                    print(f"[Shiro] RESPONSE: {msg.content}")
            elif cls == "ToolMessage":
                print(f"[Shiro] TOOL RESULT: {str(msg.content)[:300]}")
        print(f"{'='*60}\n")
        return response["messages"][-1].content
    except Exception as e:
        print(f"[Shiro] ERROR: {e}\n{'='*60}\n")
        return f"Agent error: {e}"


VALID_SOFTWARE_TAGS = ["photoshop", "clip-studio", "procreate", "illustrator", "live2d-cubism", "blender"]
VALID_FORMAT_TAGS = ["png", "jpg", "psd", "ai", "svg", "moc3", "cmo3", "zip", "mp4"]
VALID_LICENSE_TYPES = ["personal", "commercial", "extended"]

_EXTRACT_SYSTEM = f"""You are a search query extractor for a Vietnamese digital art marketplace (illustrations, Live2D, brushes, etc.).

Given a Vietnamese user search prompt, extract structured fields:
- keyword: Vietnamese search term for product name/description (keep in Vietnamese)
- min_price: minimum price in VND (null if not mentioned)
- max_price: maximum price in VND (null if not mentioned)
- software_tags: list of software tags the product is compatible with. Only use values from: {VALID_SOFTWARE_TAGS}
- format_tags: list of file format tags. Only use values from: {VALID_FORMAT_TAGS}
- danbooru_tags: list of descriptive content/style tags in Danbooru convention WITHOUT underscores (use spaces for multi-word). These describe visual style, subject matter, mood, theme, character type, color palette, etc. Extract 4-10 tags that best capture the visual concept. Examples: ["anime girl", "pastel color", "chibi", "stream overlay", "vtuber", "watercolor", "fantasy", "dark theme", "cute", "live2d"]

Rules:
- Leave fields null/empty list if not mentioned or unclear
- "miễn phí" / "free" → min_price=0, max_price=0
- "dưới Xk" → max_price = X*1000
- "photoshop" → software_tags=["photoshop"], "clip studio" → ["clip-studio"], "live2d" → ["live2d-cubism"]
- ".psd" → format_tags=["psd"], "png" → ["png"]
- Extract multiple tags if user mentions multiple software/formats
- For danbooru_tags: be creative and comprehensive — infer related tags even if not explicitly stated (e.g. "vtuber avatar" → ["vtuber", "avatar", "anime girl", "character sheet", "live2d"])
- danbooru_tags use English only, lowercase, spaces not underscores
"""


class ProductSearchQuery(BaseModel):
    keyword: Optional[str] = Field(default=None, description="Vietnamese search keyword for product name.")
    min_price: Optional[float] = Field(default=None, description="Minimum price in VND.")
    max_price: Optional[float] = Field(default=None, description="Maximum price in VND.")
    software_tags: list[str] = Field(default_factory=list, description="Software compatibility tags.")
    format_tags: list[str] = Field(default_factory=list, description="File format tags.")
    danbooru_tags: list[str] = Field(
        default_factory=list,
        description="Descriptive content/style tags in Danbooru style WITHOUT underscores. Multi-word tags use spaces. English only.",
    )


def extract_search_query(user_prompt: str) -> ProductSearchQuery:
    print(f"\n{'='*60}")
    print(f"[Shiro/extract] PROMPT: {user_prompt}")
    prompt = ChatPromptTemplate.from_messages([
        ("system", _EXTRACT_SYSTEM),
        ("human", "{input}"),
    ])
    try:
        chain = prompt | _get_llm().with_structured_output(ProductSearchQuery)
        result = chain.invoke({"input": user_prompt})
        result.software_tags = [t for t in (result.software_tags or []) if t in VALID_SOFTWARE_TAGS]
        result.format_tags = [t for t in (result.format_tags or []) if t in VALID_FORMAT_TAGS]
        print(f"[Shiro/extract] RESULT: keyword={result.keyword!r} price=[{result.min_price}, {result.max_price}] software={result.software_tags} format={result.format_tags} danbooru={result.danbooru_tags}")
        print(f"{'='*60}\n")
        return result
    except Exception as e:
        print(f"[Shiro/extract] ERROR: {e}\n{'='*60}\n")
        return ProductSearchQuery()
