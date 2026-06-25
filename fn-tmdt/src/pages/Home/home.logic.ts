import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { cacaoClient } from '../../apollo';
import { SUGGESTIONS_QUERY } from '../../graphql/suggestions';

/** @deprecated ProductDetailPage still uses this — will be removed when that page is refactored */
export const useHomeData = () => ({ assets: [] as never[] });

export interface HomeProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  tags: string[];
  licenseType: string;
  authorName: string;
  authorAvatar: string | null;
  authorShortlink: string;
  createdAt: string;
}

const PAGE_SIZE = 20;

export const useHomeProducts = () => {
  const [offset, setOffset] = useState(0);
  const [allProducts, setAllProducts] = useState<HomeProduct[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, loading, fetchMore } = useQuery(SUGGESTIONS_QUERY, {
    client: cacaoClient,
    variables: { offset: 0, limit: PAGE_SIZE },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    const items: HomeProduct[] = (data as { suggestions?: HomeProduct[] } | undefined)?.suggestions ?? [];
    if (items.length === 0) return;
    setAllProducts(items);
    if (items.length < PAGE_SIZE) setHasMore(false);
  }, [data]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextOffset = offset + PAGE_SIZE;
    const result = await fetchMore({ variables: { offset: nextOffset, limit: PAGE_SIZE } });
    const newItems: HomeProduct[] = (result.data as { suggestions: HomeProduct[] }).suggestions ?? [];
    setAllProducts((prev) => [...prev, ...newItems]);
    setOffset(nextOffset);
    if (newItems.length < PAGE_SIZE) setHasMore(false);
  }, [hasMore, loading, offset, fetchMore]);

  return { products: allProducts, loading, hasMore, loadMore };
};
