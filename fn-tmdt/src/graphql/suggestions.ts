import { gql } from '@apollo/client';

const SUGGESTION_FIELDS = gql`
  fragment SuggestionFields on SuggestionProduct {
    id
    name
    price
    imageUrl
    tags
    licenseType
    softwareTags
    formatTags
    authorName
    authorAvatar
    authorShortlink
    createdAt
  }
`;

export const SUGGESTIONS_QUERY = gql`
  ${SUGGESTION_FIELDS}
  query Suggestions($offset: Int!, $limit: Int!) {
    suggestions(offset: $offset, limit: $limit) {
      ...SuggestionFields
    }
  }
`;

export const FILTERED_SUGGESTIONS_QUERY = gql`
  ${SUGGESTION_FIELDS}
  query FilteredSuggestions(
    $keyword: String
    $minPrice: Float
    $maxPrice: Float
    $isFree: Boolean
    $licenseTypes: [String!]
    $softwareTags: [String!]
    $formatTags: [String!]
    $limit: Int!
  ) {
    filteredSuggestions(
      keyword: $keyword
      minPrice: $minPrice
      maxPrice: $maxPrice
      isFree: $isFree
      licenseTypes: $licenseTypes
      softwareTags: $softwareTags
      formatTags: $formatTags
      limit: $limit
    ) {
      ...SuggestionFields
    }
  }
`;

export const PERSONALIZED_RECOMMENDATIONS_QUERY = gql`
  ${SUGGESTION_FIELDS}
  query PersonalizedRecommendations($userId: String!, $limit: Int!) {
    personalizedRecommendations(userId: $userId, limit: $limit) {
      ...SuggestionFields
    }
  }
`;

export const SUGGESTIONS_COUNT_QUERY = gql`
  query SuggestionsCount {
    suggestionsCount
  }
`;

export const AI_SEARCH_PRODUCTS_QUERY = gql`
  ${SUGGESTION_FIELDS}
  query SearchProductsByAI($prompt: String!) {
    searchProductsByAi(prompt: $prompt) {
      ...SuggestionFields
    }
  }
`;
