import { gql } from '@apollo/client';

export const CATEGORIES_QUERY = gql`
  query Categories {
    categories {
      id
      name
      description
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct(
    $name: String!
    $description: String!
    $price: Float!
    $imageUrls: [String!]!
    $mainFileUrl: String
    $userTags: [String!]
    $licenseType: String
    $softwareTags: [String!]
    $formatTags: [String!]
    $stockQuantity: Int
  ) {
    createProduct(
      name: $name
      description: $description
      price: $price
      imageUrls: $imageUrls
      mainFileUrl: $mainFileUrl
      userTags: $userTags
      licenseType: $licenseType
      softwareTags: $softwareTags
      formatTags: $formatTags
      stockQuantity: $stockQuantity
    ) {
      id
      name
      price
      imageUrls
      userTags
      aiTags
      licenseType
      createdAt
    }
  }
`;
