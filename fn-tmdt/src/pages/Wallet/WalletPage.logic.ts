import { useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { MY_WALLET_QUERY } from '../../graphql/wallet';
import type { MyWalletData } from '../../graphql/wallet';
import { WalletService } from '../../services/api/wallet.service';

export function useWalletLogic() {
  const { data, loading, error, refetch } = useQuery<MyWalletData>(MY_WALLET_QUERY);
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      if (vnpResponseCode) {
        try {
          const res = await WalletService.verifyTopup(searchParams.toString());
          if (res.success) {
            alert('Nạp tiền thành công!');
            refetch();
          } else {
            alert('Nạp tiền thất bại: ' + res.message);
          }
        } catch (err) {
          console.error(err);
          alert('Có lỗi xảy ra khi xác minh giao dịch');
        } finally {
          navigate(location.pathname, { replace: true });
        }
      }
    };
    verify();
  }, [searchParams, navigate, location.pathname, refetch]);

  const handleTopup = async () => {
    if (topupAmount <= 0) return;
    try {
      setIsToppingUp(true);
      const res = await WalletService.topupWallet(topupAmount, window.location.origin + window.location.pathname);
      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (err) {
      console.error('Failed to initiate topup', err);
      // We can handle toast here if needed
    } finally {
      setIsToppingUp(false);
    }
  };

  return {
    wallet: data?.myWallet,
    loading,
    error,
    refetch,
    topupAmount,
    setTopupAmount,
    handleTopup,
    isToppingUp,
  };
}
