import { gql } from '@apollo/client';

export const SUGGESTIONS_QUERY = gql`
  query Suggestions($offset: Int!, $limit: Int!) {
    suggestions(offset: $offset, limit: $limit) {
      id
      name
      price
      imageUrl
      tags
      licenseType
      authorName
      authorAvatar
      authorShortlink
      createdAt
    }
  }
`;

export const SUGGESTIONS_COUNT_QUERY = gql`
  query SuggestionsCount {
    suggestionsCount
  }
`;
