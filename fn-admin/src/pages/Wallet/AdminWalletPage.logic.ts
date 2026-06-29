import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  ADMIN_WITHDRAWALS_QUERY,
  APPROVE_WITHDRAWAL_MUTATION,
  REJECT_WITHDRAWAL_MUTATION,
  ADMIN_WALLET_STATS_QUERY,
  ADMIN_ALL_WALLET_TRANSACTIONS_QUERY,
} from '../../services/graphql/wallet';

export type TabKey = 'stats' | 'transactions' | 'withdrawals';

interface WalletStats {
  adminWalletStats: {
    totalTopup: number;
    totalPayment: number;
    totalRefund: number;
    totalWithdrawal: number;
    totalInflow: number;
    totalOutflow: number;
    totalTurnover: number;
  };
}

interface WalletTxItem {
  id: string;
  walletId: string;
  transactionType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  referenceId: string | null;
  createdAt: string;
  userEmail: string | null;
  userId: string | null;
}

interface AllTransactionsData {
  adminAllWalletTransactions: {
    items: WalletTxItem[];
    totalItems: number;
    totalPages: number;
  };
}

interface WithdrawalsData {
  adminWithdrawalRequests: any[];
}

export function useWalletStats() {
  return useQuery<WalletStats>(ADMIN_WALLET_STATS_QUERY, { fetchPolicy: 'network-only' });
}

export function useAllTransactions() {
  const [txType, setTxType] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useQuery<AllTransactionsData>(ADMIN_ALL_WALLET_TRANSACTIONS_QUERY, {
    variables: { transactionType: txType, status: txStatus, page, limit: 20 },
    fetchPolicy: 'network-only',
  });

  useEffect(() => { setPage(1); }, [txType, txStatus]);

  return {
    items: data?.adminAllWalletTransactions?.items ?? [],
    totalItems: data?.adminAllWalletTransactions?.totalItems ?? 0,
    totalPages: data?.adminAllWalletTransactions?.totalPages ?? 1,
    loading,
    error,
    txType,
    setTxType,
    txStatus,
    setTxStatus,
    page,
    setPage,
  };
}

export function useWithdrawals() {
  const [filter, setFilter] = useState<string>('PENDING');
  const [localRequests, setLocalRequests] = useState<any[]>([]);

  const { data, loading, error, refetch } = useQuery<WithdrawalsData>(ADMIN_WITHDRAWALS_QUERY, {
    variables: { status: filter === 'ALL' ? null : filter },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data?.adminWithdrawalRequests) setLocalRequests(data.adminWithdrawalRequests);
  }, [data]);

  const [approveWithdrawal] = useMutation(APPROVE_WITHDRAWAL_MUTATION);
  const [rejectWithdrawal] = useMutation(REJECT_WITHDRAWAL_MUTATION);

  const handleApprove = async (transactionId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu rút tiền này?')) return;
    setLocalRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'SUCCESS' } : r));
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
    setLocalRequests(prev => prev.map(r => r.id === transactionId ? { ...r, status: 'FAILED' } : r));
    try {
      await rejectWithdrawal({ variables: { transactionId } });
      refetch();
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra');
      refetch();
    }
  };

  return { requests: localRequests, loading, error, filter, setFilter, handleApprove, handleReject };
}
