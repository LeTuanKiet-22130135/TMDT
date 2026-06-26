import { gql } from '@apollo/client';

export const MY_FOLLOWED_AUTHORS_QUERY = gql`
  query MyFollowedAuthors {
    myFollowedAuthors {
      id
      shortlink
      fullName
      avatarUrl
      isVerified
      isGold
      productCount
    }
  }
`;

export const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($shortlink: String!) {
    isFollowing(shortlink: $shortlink)
  }
`;

export const FOLLOWING_FEED_QUERY = gql`
  query FollowingFeed($page: Int, $limit: Int) {
    followingFeed(page: $page, limit: $limit) {
      items {
        id
        name
        price
        imageUrls
        store { id name owner { username fullName avatarUrl shortlink } }
      }
      totalItems
      totalPages
    }
  }
`;

export const FOLLOW_MUTATION = gql`
  mutation FollowAuthor($shortlink: String!) {
    followAuthor(shortlink: $shortlink)
  }
`;

export const UNFOLLOW_MUTATION = gql`
  mutation UnfollowAuthor($shortlink: String!) {
    unfollowAuthor(shortlink: $shortlink)
  }
`;

export const MY_PURCHASED_IDS_QUERY = gql`
  query MyPurchasedProductIds {
    myPurchasedProductIds
  }
`;

export const MY_PURCHASED_PRODUCTS_QUERY = gql`
  query MyPurchasedProducts {
    myPurchasedProducts {
      id
      name
      description
      price
      imageUrls
      mainFileUrl
      store {
        name
      }
    }
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
