import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { ADMIN_WITHDRAWALS_QUERY, APPROVE_WITHDRAWAL_MUTATION, REJECT_WITHDRAWAL_MUTATION } from '../../services/graphql/wallet';

export function useAdminWalletLogic() {
  const [filter, setFilter] = useState<string>('PENDING');
  const [localRequests, setLocalRequests] = useState<any[]>([]);
  
  const { data, loading, error, refetch } = useQuery(ADMIN_WITHDRAWALS_QUERY, {
    variables: { status: filter === 'ALL' ? null : filter },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.adminWithdrawalRequests) {
      setLocalRequests(data.adminWithdrawalRequests);
    }
  }, [data]);

  const [approveWithdrawal] = useMutation(APPROVE_WITHDRAWAL_MUTATION);
  const [rejectWithdrawal] = useMutation(REJECT_WITHDRAWAL_MUTATION);

  const handleApprove = async (transactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu rút tiền này?')) return;
    
    // Optimistic update
    setLocalRequests(prev => prev.map(req => req.id === transactionId ? { ...req, status: 'SUCCESS' } : req));
    
    try {
      await approveWithdrawal({ variables: { transactionId } });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
      refetch();
    }
  };

  const handleReject = async (transactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu rút tiền này? Tiền sẽ được hoàn lại vào ví người dùng.')) return;
    
    // Optimistic update
    setLocalRequests(prev => prev.map(req => req.id === transactionId ? { ...req, status: 'FAILED' } : req));
    
    try {
      await rejectWithdrawal({ variables: { transactionId } });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
      refetch();
    }
  };

  return {
    requests: localRequests,
    loading,
    error,
    filter,
    setFilter,
    handleApprove,
    handleReject,
    refetch,
  };
}
