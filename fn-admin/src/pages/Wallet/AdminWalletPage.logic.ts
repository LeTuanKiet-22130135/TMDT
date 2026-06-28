import { useQuery } from '@apollo/client/react';
import { MY_WALLET_QUERY } from '../../services/graphql/wallet';

export function useAdminWalletLogic() {
  const { data, loading, error, refetch } = useQuery(MY_WALLET_QUERY);

  return {
    wallet: data?.myWallet,
    loading,
    error,
    refetch,
  };
}
