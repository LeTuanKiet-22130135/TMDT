import { gql } from '@apollo/client';

const TRENDING_PRODUCT_FIELDS = gql`
  fragment TrendingProductFields on ProductType {
    id
    name
    price
    imageUrls
    licenseType
    userTags
    softwareTags
    formatTags
    soldQuantity
    store {
      owner {
        fullName
        avatarUrl
        shortlink
      }
    }
  }
`;

export const TRENDING_BY_TAG_QUERY = gql`
  ${TRENDING_PRODUCT_FIELDS}
  query TrendingByTag($tag: String!, $limit: Int) {
    trendingByTag(tag: $tag, limit: $limit) {
      ...TrendingProductFields
    }
  }
`;

export const BEST_SELLERS_QUERY = gql`
  ${TRENDING_PRODUCT_FIELDS}
  query BestSellers($limit: Int) {
    bestSellers(limit: $limit) {
      ...TrendingProductFields
    }
  }
`;

export const POPULAR_TAGS_QUERY = gql`
  query PopularTags($limit: Int) {
    popularTags(limit: $limit)
  }
`;
