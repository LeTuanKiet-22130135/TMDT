import strawberry

from app.graphql.mutations.auth import AuthMutation
from app.graphql.mutations.user import UserMutation
from app.graphql.mutations.product import ProductMutation
from app.graphql.mutations.admin import AdminMutation
from app.graphql.mutations.follow import FollowMutation
from app.graphql.mutations.review import ReviewMutation
from app.graphql.mutations.comment import CommentMutation

@strawberry.type
class Mutation(AuthMutation, UserMutation, ProductMutation, AdminMutation, FollowMutation, ReviewMutation, CommentMutation):
    pass
