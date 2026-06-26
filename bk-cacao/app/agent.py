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
- danbooru_tags: EXHAUSTIVE list of Danbooru-style content/style tags describing the visual concept.
  Extract 10-20 tags covering ALL of these categories (skip only if truly irrelevant):
  1. SUBJECT: character type, species, gender (e.g. "anime girl", "catgirl", "chibi character", "vtuber")
  2. STYLE: art style, rendering (e.g. "anime style", "watercolor", "pixel art", "flat design", "pastel")
  3. MOOD/THEME: atmosphere, emotion (e.g. "cute", "dark", "fantasy", "cozy", "horror", "romantic")
  4. COLOR: dominant colors/palette (e.g. "pastel color", "pink theme", "monochrome", "colorful")
  5. USE-CASE: what it's used for (e.g. "stream overlay", "twitch alert", "profile picture", "thumbnail", "wallpaper", "vtuber model", "discord emote")
  6. CONTENT CATEGORY: product type (e.g. "illustration", "character sheet", "brush set", "overlay", "avatar", "live2d model", "sticker", "emote pack")
  7. RELATED CONCEPTS: anything inferrable (e.g. "streaming", "gaming", "idol", "moe", "kawaii", "japanese art")

  Rules for danbooru_tags:
  - English only, lowercase, spaces not underscores
  - Be AGGRESSIVE with inference — "vtuber avatar pastel" → at minimum: ["vtuber", "avatar", "anime girl", "pastel color", "pink theme", "cute", "character sheet", "live2d", "streaming", "moe", "kawaii", "illustration"]
  - Always include both specific ("chibi vtuber") and general ("chibi", "vtuber") variants
  - Aim for 12-18 tags per query
  - ONLY include tags you are highly confident about — do NOT guess vague tags
  - Prefer precision over recall: 8 accurate tags > 18 uncertain tags

- primary_tags: 1-3 CORE IDENTITY TAGS that are the absolute essence of the search.
  These are the most specific, defining characteristics that MUST be present in matching products.
  Rules:
  - Only 1-3 tags maximum — choose only what is most essential
  - Each tag must be HIGHLY SPECIFIC (e.g. "pink hair" not just "hair", "chibi vtuber" not just "vtuber")
  - Cover identity dimensions: physical trait (hair color, clothing), subject type, or key use-case
  - Match as close to Danbooru canonical tag format as possible (e.g. "pink hair", "cat ears", "white dress")
  - Used for near-exact matching (90% similarity threshold): must be precise
  - Examples:
    * "illustration à style pastel cho vtuber" → primary_tags=["pastel color", "vtuber", "illustration"]
    * "live2d model óc chó tai mèo" → primary_tags=["cat ears", "live2d model"]
    * "brush set watercolor cho clip studio" → primary_tags=["watercolor", "brush set"]
    * If prompt is vague like "illustration đẹp" → primary_tags=[] (empty, do not force)

- high_confidence: set to true when the user's prompt is SPECIFIC and UNAMBIGUOUS:
  * Mentions clear visual style (e.g. "chibi", "watercolor", "pixel art")
  * Mentions clear subject (e.g. "anime girl", "catgirl", "vtuber model")
  * Mentions clear use-case (e.g. "stream overlay", "discord emote")
  * Mentions specific color palette or theme
  → high_confidence = true means: trust the danbooru tags, apply strict matching
  → high_confidence = false when prompt is vague, generic, or just a single word like "illustration đẹp"

Rules:
- Leave fields null/empty list if not mentioned or unclear
- "miễn phí" / "free" → min_price=0, max_price=0
- "dưới Xk" → max_price = X*1000
- "photoshop" → software_tags=["photoshop"], "clip studio" → ["clip-studio"], "live2d" → ["live2d-cubism"]
- ".psd" → format_tags=["psd"], "png" → ["png"]
- Extract multiple tags if user mentions multiple software/formats
"""


class ProductSearchQuery(BaseModel):
    keyword: Optional[str] = Field(default=None, description="Vietnamese search keyword for product name.")
    min_price: Optional[float] = Field(default=None, description="Minimum price in VND.")
    max_price: Optional[float] = Field(default=None, description="Maximum price in VND.")
    software_tags: list[str] = Field(default_factory=list, description="Software compatibility tags.")
    format_tags: list[str] = Field(default_factory=list, description="File format tags.")
    primary_tags: list[str] = Field(
        default_factory=list,
        description="1-3 core identity tags that are the absolute essence of the search. Highly specific, near-exact Danbooru tags. Used for 90% similarity matching. E.g. ['pink hair', 'cat ears', 'vtuber'].",
    )
    danbooru_tags: list[str] = Field(
        default_factory=list,
        description="Precise content/style tags in Danbooru style. Only include tags you are confident about. English only, spaces not underscores.",
    )
    high_confidence: bool = Field(
        default=False,
        description="True when the user prompt is specific and unambiguous (clear style, subject, use-case). Enables strict tag-priority search.",
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
