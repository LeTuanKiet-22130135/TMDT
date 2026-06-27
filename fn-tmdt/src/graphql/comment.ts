import { gql } from '@apollo/client/core';

export const GET_PRODUCT_COMMENTS = gql`
  query GetProductComments($productId: UUID!, $page: Int, $limit: Int) {
    productComments(productId: $productId, page: $page, limit: $limit) {
      items {
        id
        content
        createdAt
        parentId
        user {
          id
          fullName
          avatarUrl
        }
      }
      totalItems
      totalPages
    }
  }
`;

export const ADD_COMMENT_MUTATION = gql`
  mutation AddComment($productId: UUID!, $content: String!, $parentId: UUID) {
    addComment(productId: $productId, content: $content, parentId: $parentId)
  }
`;
