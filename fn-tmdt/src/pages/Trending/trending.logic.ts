import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { TRENDING_BY_TAG_QUERY, BEST_SELLERS_QUERY, POPULAR_TAGS_QUERY } from '../../graphql/trending';
import type { HomeProduct } from '../Home/home.logic';

interface TrendingProduct {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
  licenseType: string;
  userTags: string[];
  softwareTags: string[];
  formatTags: string[];
  soldQuantity: number;
  store: {
    owner: {
      fullName: string;
      avatarUrl: string | null;
      shortlink: string;
    };
  };
}

function toHomeProduct(p: TrendingProduct): HomeProduct {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrls?.[0] ?? '',
    tags: [...(p.userTags ?? []), ...(p.softwareTags ?? []), ...(p.formatTags ?? [])],
    licenseType: p.licenseType,
    softwareTags: p.softwareTags ?? [],
    formatTags: p.formatTags ?? [],
    authorName: p.store.owner.fullName,
    authorAvatar: p.store.owner.avatarUrl,
    authorShortlink: p.store.owner.shortlink,
    createdAt: '',
  };
}

export const useTrendingPage = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: tagsData, loading: tagsLoading } = useQuery<{ popularTags: string[] }>(
    POPULAR_TAGS_QUERY,
    { variables: { limit: 24 }, fetchPolicy: 'cache-and-network' },
  );

  const { data: tagProductsData, loading: tagProductsLoading } = useQuery<{
    trendingByTag: TrendingProduct[];
  }>(TRENDING_BY_TAG_QUERY, {
    variables: { tag: selectedTag, limit: 40 },
    skip: !selectedTag,
    fetchPolicy: 'cache-and-network',
  });

  const { data: bestSellersData, loading: bestSellersLoading } = useQuery<{
    bestSellers: TrendingProduct[];
  }>(BEST_SELLERS_QUERY, {
    variables: { limit: 40 },
    skip: !!selectedTag,
    fetchPolicy: 'cache-and-network',
  });

  const popularTags = tagsData?.popularTags ?? [];

  const rawProducts = selectedTag
    ? (tagProductsData?.trendingByTag ?? [])
    : (bestSellersData?.bestSellers ?? []);

  const products: HomeProduct[] = rawProducts.map(toHomeProduct);
  const loading = selectedTag ? tagProductsLoading : bestSellersLoading;

  return {
    selectedTag,
    setSelectedTag,
    popularTags,
    tagsLoading,
    products,
    loading,
  };
};
