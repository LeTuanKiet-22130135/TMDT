import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { MY_WALLET_QUERY, REQUEST_WITHDRAWAL_MUTATION } from '../../graphql/wallet';
import { useNavigate } from 'react-router-dom';

export function useWithdrawalLogic() {
  const { data, loading, refetch } = useQuery(MY_WALLET_QUERY);
  const [requestWithdrawal, { loading: withdrawing }] = useMutation(REQUEST_WITHDRAWAL_MUTATION);
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [bankDetails, setBankDetails] = useState('');
  const [error, setError] = useState('');

  const wallet = data?.myWallet;
  
  // Filter withdrawal transactions
  const withdrawals = wallet?.transactions.filter((t: any) => t.transactionType === 'WITHDRAWAL').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 50000) {
      setError('Số tiền rút tối thiểu là 50,000 ₫');
      return;
    }
    if (!bankDetails.trim()) {
      setError('Vui lòng nhập thông tin ngân hàng');
      return;
    }
    if (amount > (wallet?.balance || 0)) {
      setError('Số dư không đủ');
      return;
    }
    setError('');

    try {
      await requestWithdrawal({ variables: { amount, bankDetails } });
      alert('Gửi yêu cầu rút tiền thành công!');
      setAmount(0);
      setBankDetails('');
      refetch();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi rút tiền');
    }
  };

  return {
    wallet,
    withdrawals,
    loading,
    withdrawing,
    amount,
    setAmount,
    bankDetails,
    setBankDetails,
    error,
    handleWithdraw,
    navigate,
  };
}
