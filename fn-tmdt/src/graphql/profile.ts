import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      username
      shortlink
      shortlinkUpdatedAt
      isGold
      fullName
      avatarUrl
      bannerUrl
      bio
      specialties
      socialLinks
      isVerified
      rewardPoints
    }
  }
`;

export const AUTHOR_QUERY = gql`
  query Author($shortlink: String!) {
    author(shortlink: $shortlink) {
      id
      shortlink
      isGold
      fullName
      avatarUrl
      bannerUrl
      bio
      specialties
      socialLinks
      isVerified
      createdAt
    }
    authorProducts(shortlink: $shortlink, pageSize: 50) {
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

export const UPDATE_SHORTLINK_MUTATION = gql`
  mutation UpdateShortlink($shortlink: String!) {
    updateShortlink(shortlink: $shortlink) {
      id
      shortlink
      shortlinkUpdatedAt
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile(
    $fullName: String
    $bio: String
    $avatarUrl: String
    $bannerUrl: String
    $specialties: [String!]
    $website: String
    $twitter: String
    $instagram: String
  ) {
    updateProfile(
      fullName: $fullName
      bio: $bio
      avatarUrl: $avatarUrl
      bannerUrl: $bannerUrl
      specialties: $specialties
      website: $website
      twitter: $twitter
      instagram: $instagram
    ) {
      id
      fullName
      avatarUrl
      bannerUrl
      bio
      specialties
      socialLinks
    }
  }
`;
