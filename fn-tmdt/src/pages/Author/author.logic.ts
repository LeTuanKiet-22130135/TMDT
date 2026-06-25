import { useQuery } from '@apollo/client/react';
import { AUTHOR_QUERY } from '../../graphql/profile';

export interface AuthorProfile {
  id: string;
  shortlink: string;
  isGold: boolean;
  fullName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  specialties: string[];
  socialLinks: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  isVerified: boolean;
  createdAt: string;
}

export interface AuthorProduct {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  userTags: string[];
  aiTags: string[];
  licenseType: string;
  createdAt: string;
}

export const useAuthorData = (shortlink: string) => {
  const { data, loading } = useQuery(AUTHOR_QUERY, {
    variables: { shortlink },
    skip: !shortlink,
  });

  const profile: AuthorProfile | null = (data as { author?: AuthorProfile } | undefined)?.author ?? null;
  const products: AuthorProduct[] = (data as { authorProducts?: AuthorProduct[] } | undefined)?.authorProducts ?? [];

  const bannerImage = profile?.bannerUrl ?? (products[0]?.imageUrls[0] ?? null);

  return { profile, products, loading, bannerImage };
};
