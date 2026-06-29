import React, { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { WalletStatsCards } from './components/WalletStatsCards';
import { AllTransactionsTable } from './components/AllTransactionsTable';
import { WithdrawalRequestsTable } from './components/WithdrawalRequestsTable';
import { exportWalletReport } from './utils/exportWalletReport';
import {
  ADMIN_WALLET_STATS_QUERY,
  ADMIN_ALL_WALLET_TRANSACTIONS_QUERY,
  ADMIN_WITHDRAWALS_QUERY,
} from '../../services/graphql/wallet';
import type { TabKey } from './AdminWalletPage.logic';

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: 'stats',        label: 'Thống kê doanh thu', desc: 'Tổng quan đầu vào, đầu ra và vòng xoay' },
  { key: 'transactions', label: 'Tất cả giao dịch',   desc: 'Toàn bộ wallet_transactions theo loại và trạng thái' },
  { key: 'withdrawals',  label: 'Yêu cầu rút tiền',   desc: 'Duyệt hoặc từ chối yêu cầu rút tiền' },
];

export const AdminWalletPage: React.FC = () => {
  const { user } = useAuth();
  const client = useApolloClient();
  const [tab, setTab] = useState<TabKey>('stats');
  const [exporting, setExporting] = useState(false);

  if (!user || user.role !== 'ADMIN') {
    return <div className="p-6" style={{ color: 'var(--danger)' }}>Access Denied</div>;
  }

  const activeTab = TABS.find(t => t.key === tab)!;

  const handleExport = async () => {
    setExporting(true);
    try {
      const [statsRes, txRes, wdRes] = await Promise.all([
        client.query({ query: ADMIN_WALLET_STATS_QUERY, fetchPolicy: 'network-only' }),
        client.query({
          query: ADMIN_ALL_WALLET_TRANSACTIONS_QUERY,
          variables: { page: 1, limit: 5000 },
          fetchPolicy: 'network-only',
        }),
        client.query({
          query: ADMIN_WITHDRAWALS_QUERY,
          variables: { status: null },
          fetchPolicy: 'network-only',
        }),
      ]);

      const stats = (statsRes.data as any).adminWalletStats;
      const txItems = (txRes.data as any).adminAllWalletTransactions.items;
      const wdItems = (wdRes.data as any).adminWithdrawalRequests;

      await exportWalletReport(stats, txItems, wdItems);
    } catch (err: any) {
      alert('Lỗi xuất Excel: ' + (err.message ?? err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Quản lý Ví & Giao dịch</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{activeTab.desc}</p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #FF9FB1, #DB2E50)' }}
          >
            {exporting
              ? <><Loader2 size={16} className="animate-spin" /> Đang xuất...</>
              : <><Download size={16} /> Xuất Excel</>}
          </button>
        </div>

        <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.key ? 'var(--accent)' : 'transparent',
                color: tab === t.key ? 'white' : 'var(--text-secondary)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'stats'        && <WalletStatsCards />}
        {tab === 'transactions' && <AllTransactionsTable />}
        {tab === 'withdrawals'  && <WithdrawalRequestsTable />}
      </div>
    </div>
  );
};

export default AdminWalletPage;
