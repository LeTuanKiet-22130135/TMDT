import React from 'react';
import { Loader2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useWalletStats } from '../AdminWalletPage.logic';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface StatCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, color }) => (
  <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
    <div className="flex justify-between items-start mb-3">
      <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="p-2 rounded-xl" style={{ background: color + '20' }}>
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{fmt(value)}</div>
    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
  </div>
);

export const WalletStatsCards: React.FC = () => {
  const { data, loading, error } = useWalletStats();

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
    </div>
  );

  if (error) return (
    <div className="p-4 rounded-xl border text-sm" style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
      Lỗi tải thống kê: {error.message}
    </div>
  );

  const s = data?.adminWalletStats;
  if (!s) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Đầu vào (Nạp + Hoàn)"
          value={s.totalInflow}
          sub={`Nạp: ${fmt(s.totalTopup)} · Hoàn: ${fmt(s.totalRefund)}`}
          icon={<TrendingUp size={18} />}
          color="#10b981"
        />
        <StatCard
          label="Đầu ra (Mua + Rút)"
          value={s.totalOutflow}
          sub={`Giao dịch mua: ${fmt(s.totalPayment)} · Rút: ${fmt(s.totalWithdrawal)}`}
          icon={<TrendingDown size={18} />}
          color="#f43f5e"
        />
        <StatCard
          label="Vòng xoay (Tổng thành công)"
          value={s.totalTurnover}
          sub={`Dòng tiền lưu thông qua hệ thống`}
          icon={<RefreshCw size={18} />}
          color="#F65C88"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng nạp', value: s.totalTopup, color: '#10b981' },
          { label: 'Tổng mua', value: s.totalPayment, color: '#38bdf8' },
          { label: 'Tổng hoàn', value: s.totalRefund, color: '#fbbf24' },
          { label: 'Tổng rút', value: s.totalWithdrawal, color: '#f43f5e' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-base font-semibold" style={{ color }}>{fmt(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
