import { gql } from '@apollo/client';

export const MY_PURCHASED_IDS_QUERY = gql`
  query MyPurchasedProductIds {
    myPurchasedProductIds
  }
`;

export const PRODUCT_DETAIL_QUERY = gql`
  query ProductDetail($productId: UUID!) {
    product(productId: $productId) {
      id
      name
      description
      price
      imageUrls
      userTags
      aiTags
      licenseType
      softwareTags
      formatTags
      store {
        id
        name
        owner {
          username
          fullName
          avatarUrl
          shortlink
        }
      }
    }
  }
`;

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
