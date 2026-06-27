from typing import List

import strawberry

from app.gql_types import AiSearchResult, SuggestionProduct
from app.mutations import Mutation
from app.query_catalog import filtered_suggestions, suggestions, suggestions_count
from app.query_recommend import personalized_recommendations, semantic_search_products
from app.query_search import search_products_by_ai


@strawberry.type
class Query:
    suggestions: List[SuggestionProduct] = strawberry.field(resolver=suggestions)
    suggestions_count: int = strawberry.field(resolver=suggestions_count)
    filtered_suggestions: List[SuggestionProduct] = strawberry.field(resolver=filtered_suggestions)
    search_products_by_ai: AiSearchResult = strawberry.field(resolver=search_products_by_ai)
    semantic_search_products: List[SuggestionProduct] = strawberry.field(resolver=semantic_search_products)
    personalized_recommendations: List[SuggestionProduct] = strawberry.field(resolver=personalized_recommendations)


schema = strawberry.Schema(query=Query, mutation=Mutation)
