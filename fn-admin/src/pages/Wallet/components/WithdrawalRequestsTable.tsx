import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useWithdrawals } from '../AdminWalletPage.logic';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s));

export const WithdrawalRequestsTable: React.FC = () => {
  const { requests, loading, error, filter, setFilter, handleApprove, handleReject } = useWithdrawals();

  return (
    <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="p-4 border-b flex gap-2" style={{ borderColor: 'var(--border)' }}>
        {(['PENDING', 'SUCCESS', 'FAILED', 'ALL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              borderColor: filter === f ? 'var(--accent)' : 'var(--border)',
            }}>
            {f === 'PENDING' ? 'Chờ duyệt' : f === 'SUCCESS' ? 'Đã duyệt' : f === 'FAILED' ? 'Bị từ chối' : 'Tất cả'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 text-sm" style={{ color: 'var(--danger)' }}>Lỗi: {error.message}</div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} /></div>
      ) : requests.length === 0 ? (
        <div className="p-12 flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
          <Search size={48} className="mb-4 opacity-50" /><p>Không có yêu cầu rút tiền nào.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider border-b" style={{ background: 'var(--background)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                <th className="p-4 font-medium">Mã GD</th>
                <th className="p-4 font-medium">Số tiền</th>
                <th className="p-4 font-medium">Thông tin nhận (Bank)</th>
                <th className="p-4 font-medium">Trạng thái</th>
                <th className="p-4 font-medium">Thời gian tạo</th>
                <th className="p-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {requests.map((req: any) => (
                <tr key={req.id} className="border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{req.id.split('-')[0]}...</td>
                  <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(req.amount)}</td>
                  <td className="p-4 max-w-[300px] text-xs" style={{ color: 'var(--text-secondary)' }}>{req.referenceId || '-'}</td>
                  <td className="p-4">
                    {req.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Clock size={12} /> Chờ xử lý
                      </span>
                    )}
                    {req.status === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <CheckCircle size={12} /> Đã chuyển
                      </span>
                    )}
                    {req.status === 'FAILED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
                        <XCircle size={12} /> Từ chối
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{fmtDate(req.createdAt)}</td>
                  <td className="p-4 text-right">
                    {req.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(req.id)}
                          className="px-3 py-1.5 text-xs font-medium text-white rounded-md shadow-sm"
                          style={{ background: '#10b981' }}>
                          Duyệt
                        </button>
                        <button onClick={() => handleReject(req.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-md"
                          style={{ background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e' }}>
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
