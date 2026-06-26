import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { cacaoClient } from '../../apollo';
import { SUGGESTIONS_QUERY, FILTERED_SUGGESTIONS_QUERY, PERSONALIZED_RECOMMENDATIONS_QUERY } from '../../graphql/suggestions';
import type { SearchFilters } from '../../contexts/SearchFilterContext';
import { isFiltersEmpty } from '../../contexts/SearchFilterContext';

/** @deprecated ProductDetailPage still uses this — will be removed when that page is refactored */
export const useHomeData = () => ({ assets: [] as any[] });

export interface HomeProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  tags: string[];
  licenseType: string;
  softwareTags?: string[];
  formatTags?: string[];
  authorName: string;
  authorAvatar: string | null;
  authorShortlink: string;
  createdAt: string;
}

const PAGE_SIZE = 20;
const MAX_ITEMS = 100;

export const useHomeProducts = () => {
  const [hasMore, setHasMore] = useState(true);
  const [reachedMax, setReachedMax] = useState(false);

  const { data, loading, fetchMore, refetch } = useQuery<{ suggestions?: HomeProduct[] }>(SUGGESTIONS_QUERY, {
    client: cacaoClient,
    variables: { offset: 0, limit: PAGE_SIZE },
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const products: HomeProduct[] = data?.suggestions ?? [];

  useEffect(() => {
    if (products.length > 0 && products.length < PAGE_SIZE) {
      setHasMore(false);
    }
  }, [products.length]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextOffset = products.length;
    
    if (nextOffset >= MAX_ITEMS) {
      setHasMore(false);
      setReachedMax(true);
      return;
    }

    try {
      await fetchMore({
        variables: { offset: nextOffset, limit: PAGE_SIZE },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          const prevItems = (prev as { suggestions: HomeProduct[] }).suggestions ?? [];
          const newItems = (fetchMoreResult as { suggestions: HomeProduct[] }).suggestions ?? [];
          if (newItems.length < PAGE_SIZE) {
            setHasMore(false);
          }
          const merged = [...prevItems, ...newItems];
          if (merged.length >= MAX_ITEMS) {
             setHasMore(false);
             setReachedMax(true);
             return { suggestions: merged.slice(0, MAX_ITEMS) };
          }
          return { suggestions: merged };
        },
      });
    } catch (err) {
      console.error('[useHomeProducts] loadMore error:', err);
    }
  }, [hasMore, loading, products.length, fetchMore]);

  const refresh = useCallback(async () => {
    setHasMore(true);
    setReachedMax(false);
    await refetch({ offset: 0, limit: PAGE_SIZE });
  }, [refetch]);

  return { products, loading, hasMore, reachedMax, loadMore, refresh };
};

const P_INITIAL = 20;
const P_PAGE = 10;
const P_MAX = 50;

export const usePersonalizedFeed = (userId: string | null | undefined) => {
  const [displayCount, setDisplayCount] = useState(P_INITIAL);

  const { data, loading, refetch } = useQuery(PERSONALIZED_RECOMMENDATIONS_QUERY, {
    client: cacaoClient,
    skip: !userId,
    variables: { userId: userId ?? '', limit: P_MAX },
    fetchPolicy: 'network-only',
  });

  // Reset when user changes (login/logout)
  useEffect(() => { setDisplayCount(P_INITIAL); }, [userId]);

  const pool: HomeProduct[] = (data as { personalizedRecommendations?: HomeProduct[] } | undefined)?.personalizedRecommendations ?? [];
  const cap = Math.min(pool.length, P_MAX);
  const products = pool.slice(0, displayCount);
  const hasMore = !loading && pool.length > 0 && displayCount < cap;
  const reachedMax = !loading && pool.length > 0 && displayCount >= cap;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + P_PAGE, P_MAX));
  }, []);

  const refresh = useCallback(async () => {
    setDisplayCount(P_INITIAL);
    await refetch();
  }, [refetch]);

  return { products, loading, hasMore, reachedMax, loadMore, refresh };
};

export const useFilteredProducts = (filters: SearchFilters | null) => {
  const active = !!filters && !isFiltersEmpty(filters);

  const { data, loading } = useQuery(FILTERED_SUGGESTIONS_QUERY, {
    client: cacaoClient,
    skip: !active,
    variables: active && filters ? {
      keyword: filters.keyword.trim() || undefined,
      minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
      isFree: filters.isFreeOnly || undefined,
      licenseTypes: filters.licenseTypes.length ? filters.licenseTypes : undefined,
      softwareTags: filters.softwareTags.length ? filters.softwareTags : undefined,
      formatTags: filters.formatTags.length ? filters.formatTags : undefined,
      limit: 100,
    } : {},
    fetchPolicy: 'network-only',
  });

  const products: HomeProduct[] = (data as { filteredSuggestions?: HomeProduct[] } | undefined)?.filteredSuggestions ?? [];
  return { products, loading, isActive: active };
};
