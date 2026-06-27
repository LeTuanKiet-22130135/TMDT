import strawberry
from app.graphql.types import UserType

@strawberry.type
class TokenType:
    access_token: str
    refresh_token: str
    user: UserType
