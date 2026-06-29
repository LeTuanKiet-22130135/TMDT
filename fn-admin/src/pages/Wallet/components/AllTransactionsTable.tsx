import React from 'react';
import { Loader2, Search } from 'lucide-react';
import { useAllTransactions } from '../AdminWalletPage.logic';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s));

const TX_TYPES = ['ALL', 'TOPUP', 'PAYMENT', 'REFUND', 'WITHDRAWAL'];
const TX_STATUS = ['ALL', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'];

const TX_LABEL: Record<string, string> = {
  TOPUP: 'Nạp tiền', PAYMENT: 'Giao dịch mua', REFUND: 'Hoàn tiền', WITHDRAWAL: 'Rút tiền',
};
const TX_COLOR: Record<string, string> = {
  TOPUP: '#10b981', PAYMENT: '#38bdf8', REFUND: '#fbbf24', WITHDRAWAL: '#f43f5e',
};
const STATUS_COLOR: Record<string, string> = {
  SUCCESS: '#10b981', PENDING: '#f59e0b', FAILED: '#f43f5e', CANCELLED: '#94a3b8',
};
const STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Thành công', PENDING: 'Đang xử lý', FAILED: 'Thất bại', CANCELLED: 'Đã huỷ',
};

export const AllTransactionsTable: React.FC = () => {
  const { items, totalItems, totalPages, loading, error, txType, setTxType, txStatus, setTxStatus, page, setPage } = useAllTransactions();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1">
          {TX_TYPES.map(t => (
            <button key={t} onClick={() => setTxType(t === 'ALL' ? null : t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                background: (txType ?? 'ALL') === t ? 'var(--accent)' : 'transparent',
                color: (txType ?? 'ALL') === t ? 'white' : 'var(--text-secondary)',
                borderColor: (txType ?? 'ALL') === t ? 'var(--accent)' : 'var(--border)',
              }}>
              {TX_LABEL[t] ?? t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TX_STATUS.map(s => (
            <button key={s} onClick={() => setTxStatus(s === 'ALL' ? null : s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
              style={{
                background: (txStatus ?? 'ALL') === s ? '#64748b' : 'transparent',
                color: (txStatus ?? 'ALL') === s ? 'white' : 'var(--text-muted)',
                borderColor: (txStatus ?? 'ALL') === s ? '#64748b' : 'var(--border)',
              }}>
              {STATUS_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} /></div>
        ) : error ? (
          <div className="p-6 text-sm" style={{ color: 'var(--danger)' }}>Lỗi: {error.message}</div>
        ) : items.length === 0 ? (
          <div className="p-12 flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
            <Search size={48} className="mb-4 opacity-50" />
            <p>Không có giao dịch nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider border-b" style={{ background: 'var(--background)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                  <th className="p-4 font-medium">Mã GD</th>
                  <th className="p-4 font-medium">Người dùng</th>
                  <th className="p-4 font-medium">Loại</th>
                  <th className="p-4 font-medium">Số tiền</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {items.map((tx: any) => (
                  <tr key={tx.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="p-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{tx.id.split('-')[0]}...</td>
                    <td className="p-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{tx.userEmail ?? '-'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: (TX_COLOR[tx.transactionType] ?? '#64748b') + '20', color: TX_COLOR[tx.transactionType] ?? '#64748b', border: `1px solid ${TX_COLOR[tx.transactionType] ?? '#64748b'}40` }}>
                        {TX_LABEL[tx.transactionType] ?? tx.transactionType}
                      </span>
                    </td>
                    <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(tx.amount)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: (STATUS_COLOR[tx.status] ?? '#64748b') + '20', color: STATUS_COLOR[tx.status] ?? '#64748b', border: `1px solid ${STATUS_COLOR[tx.status] ?? '#64748b'}40` }}>
                        {STATUS_LABEL[tx.status] ?? tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmtDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Tổng {totalItems} giao dịch</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}>← Trước</button>
            <span className="px-3 py-1.5 text-xs">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40"
              style={{ borderColor: 'var(--border)' }}>Sau →</button>
          </div>
        </div>
      )}
    </div>
  );
};
