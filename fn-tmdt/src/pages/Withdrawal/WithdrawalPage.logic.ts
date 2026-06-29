import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { MY_WALLET_QUERY, REQUEST_WITHDRAWAL_MUTATION } from '../../graphql/wallet';
import type { MyWalletData } from '../../graphql/wallet';
import { useNavigate } from 'react-router-dom';

export const VIETNAM_BANKS = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'CTG', name: 'VietinBank' },
  { code: 'AGR', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MBB', name: 'MB Bank' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'MSB', name: 'MSB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'VIB', name: 'VIB' },
];

export const MIN_WITHDRAWAL = 50000;

export function useWithdrawalLogic() {
  const { data, loading, refetch } = useQuery<MyWalletData>(MY_WALLET_QUERY);
  const [requestWithdrawal, { loading: withdrawing }] = useMutation(REQUEST_WITHDRAWAL_MUTATION);
  const navigate = useNavigate();

  const [amount, setAmount] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const wallet = data?.myWallet;
  const currentBalance = wallet?.balance || 0;

  const withdrawals = wallet?.transactions
    .filter((t: any) => t.transactionType === 'WITHDRAWAL')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const conditionErrors: string[] = [];
  if (currentBalance < MIN_WITHDRAWAL) {
    conditionErrors.push(`Số dư tối thiểu để rút tiền là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} ₫`);
  }
  if (amount > 0 && amount < MIN_WITHDRAWAL) {
    conditionErrors.push(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} ₫`);
  }
  if (amount > currentBalance) {
    conditionErrors.push('Số tiền rút vượt quá số dư khả dụng');
  }

  const canSubmit =
    !withdrawing &&
    amount >= MIN_WITHDRAWAL &&
    amount <= currentBalance &&
    bankName.trim() !== '' &&
    accountNumber.trim() !== '' &&
    holderName.trim() !== '';

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!bankName.trim()) { setError('Vui lòng chọn ngân hàng'); return; }
    if (!accountNumber.trim()) { setError('Vui lòng nhập số tài khoản'); return; }
    if (!holderName.trim()) { setError('Vui lòng nhập tên chủ tài khoản'); return; }
    if (amount < MIN_WITHDRAWAL) { setError(`Số tiền rút tối thiểu là ${MIN_WITHDRAWAL.toLocaleString('vi-VN')} ₫`); return; }
    if (amount > currentBalance) { setError('Số dư không đủ'); return; }

    const bankDetails = JSON.stringify({ bank: bankName, accountNumber: accountNumber.trim(), holderName: holderName.trim().toUpperCase() });

    try {
      await requestWithdrawal({ variables: { amount, bankDetails } });
      setSuccess(true);
      setAmount(0);
      setBankName('');
      setAccountNumber('');
      setHolderName('');
      refetch();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi rút tiền');
    }
  };

  return {
    wallet,
    withdrawals,
    loading,
    withdrawing,
    amount, setAmount,
    bankName, setBankName,
    accountNumber, setAccountNumber,
    holderName, setHolderName,
    error,
    success,
    conditionErrors,
    canSubmit,
    currentBalance,
    handleWithdraw,
    navigate,
  };
}
