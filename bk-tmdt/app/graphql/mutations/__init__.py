import strawberry

from app.graphql.mutations.auth import AuthMutation
from app.graphql.mutations.user import UserMutation
from app.graphql.mutations.product import ProductMutation
from app.graphql.mutations.admin import AdminMutation

@strawberry.type
class Mutation(AuthMutation, UserMutation, ProductMutation, AdminMutation):
    pass
