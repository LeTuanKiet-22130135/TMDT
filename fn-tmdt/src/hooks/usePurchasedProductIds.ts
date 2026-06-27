import { useQuery } from '@apollo/client/react';
import { MY_PURCHASED_IDS_QUERY } from '../graphql/product';

export function usePurchasedProductIds(): Set<string> {
  const token = localStorage.getItem('access_token');
  const { data } = useQuery<{ myPurchasedProductIds: string[] }>(MY_PURCHASED_IDS_QUERY, {
    skip: !token,
    fetchPolicy: 'cache-first',
  });
  return new Set<string>(data?.myPurchasedProductIds ?? []);
}
