"""
Agent GraphQL Types

Strawberry types riêng cho agent endpoint — tránh conflict với main graphql.
"""
from datetime import datetime
from typing import Optional

import strawberry


@strawberry.type
class AgentUserType:
    """Thông tin cơ bản của user trả về cho agent."""
    id: str
    email: str
    full_name: str
    role: str
    is_verified: bool
    is_active: bool


@strawberry.type
class AgentTokenType:
    """Kết quả đăng nhập trả về access token và thông tin user."""
    access_token: str
    token_type: str
    user: AgentUserType


@strawberry.type
class AgentProductType:
    """Thông tin sản phẩm trả về cho agent."""
    id: str
    store_id: str
    name: str
    description: str
    price: float
    stock_quantity: int
    image_urls: list[str]
    main_file_url: Optional[str]
    license_type: str
    user_tags: list[str]
    software_tags: list[str]
    format_tags: list[str]
    is_active: bool
    category_id: Optional[str]
    created_at: datetime
    updated_at: datetime
