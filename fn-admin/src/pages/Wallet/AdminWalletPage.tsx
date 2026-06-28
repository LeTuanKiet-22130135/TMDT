import React from 'react';
import { useAdminWalletLogic } from './AdminWalletPage.logic';
import { Loader2, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useAuth } from '../../lib/auth';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

export const AdminWalletPage: React.FC = () => {
  const { user } = useAuth();
  const { requests, loading, error, filter, setFilter, handleApprove, handleReject } = useAdminWalletLogic();

  if (!user || user.role !== 'ADMIN') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Quản lý Yêu cầu Rút tiền</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Duyệt hoặc từ chối các yêu cầu rút tiền từ người dùng.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
            Lỗi: {error.message}
          </div>
        )}

        <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-2">
              {['PENDING', 'SUCCESS', 'FAILED', 'ALL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border`}
                  style={{
                    background: filter === f ? 'var(--accent)' : 'transparent',
                    color: filter === f ? 'white' : 'var(--text-secondary)',
                    borderColor: filter === f ? 'var(--accent)' : 'var(--border)'
                  }}
                >
                  {f === 'PENDING' ? 'Chờ duyệt' :
                    f === 'SUCCESS' ? 'Đã duyệt' :
                    f === 'FAILED' ? 'Bị từ chối' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
              <Search className="mb-4 opacity-50" size={48} />
              <p>Không có yêu cầu rút tiền nào.</p>
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
                    <tr key={req.id} className="transition-colors border-b hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                      <td className="p-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {req.id.split('-')[0]}...
                      </td>
                      <td className="p-4 font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(req.amount)}
                      </td>
                      <td className="p-4 max-w-[300px]" style={{ color: 'var(--text-secondary)' }}>
                        {req.referenceId || '-'}
                      </td>
                      <td className="p-4">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                            <Clock size={12} /> Chờ xử lý
                          </span>
                        )}
                        {req.status === 'SUCCESS' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <CheckCircle size={12} /> Đã chuyển
                          </span>
                        )}
                        {req.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                            <XCircle size={12} /> Từ chối
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(req.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors shadow-sm"
                              style={{ background: '#10b981' }}
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                              style={{ background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e' }}
                            >
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
      </div>
    </div>
  );
};

export default AdminWalletPage;
