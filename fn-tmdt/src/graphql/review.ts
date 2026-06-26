import { gql } from '@apollo/client/core';

export const GET_PRODUCT_REVIEWS = gql`
  query GetProductReviews($productId: UUID!, $page: Int, $limit: Int) {
    productReviews(productId: $productId, page: $page, limit: $limit) {
      items {
        id
        rating
        comment
        createdAt
        user {
          id
          fullName
          avatarUrl
        }
      }
      totalItems
      totalPages
      averageRating
    }
  }
`;

export const ADD_REVIEW_MUTATION = gql`
  mutation AddReview($productId: UUID!, $rating: Int!, $comment: String!) {
    addReview(productId: $productId, rating: $rating, comment: $comment)
  }
`;
