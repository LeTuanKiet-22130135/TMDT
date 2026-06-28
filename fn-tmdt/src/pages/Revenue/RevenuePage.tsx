import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
// removed useTranslation
import { SELLER_REVENUE_STATS_QUERY } from '../../graphql/analytics';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { Header } from '../../components/layout/Header';

export const RevenuePage: React.FC = () => {
  const { profile } = useUserProfile();
  const [period, setPeriod] = useState<'7d' | '30d' | '1y'>('7d');

  const { data, loading, error } = useQuery<any>(SELLER_REVENUE_STATS_QUERY, {
    variables: { period },
    fetchPolicy: 'cache-and-network',
  });

  if (profile.role !== 'SELLER' && profile.role !== 'ARTIST') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-bold text-gray-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const stats = data?.sellerRevenueStats;
  const chartData = stats?.chartData || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Doanh thu của tôi</h1>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          {(['7d', '30d', '1y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full font-semibold transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-[#FF9FB1] to-[#DB2E50] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === '7d' ? '7 ngày qua' : p === '30d' ? '30 ngày qua' : '1 năm qua'}
            </button>
          ))}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Tổng doanh thu</h3>
            <p className="text-4xl font-bold text-[#DB2E50]">
              {loading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">Tổng số đơn hàng</h3>
            <p className="text-4xl font-bold text-gray-900">
              {loading ? '...' : stats?.totalOrders || 0}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Biểu đồ doanh thu</h3>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#FF9FB1] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="h-96 flex items-center justify-center text-red-500">
              Có lỗi xảy ra khi tải dữ liệu.
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-96 flex items-center justify-center text-gray-400">
              Chưa có dữ liệu.
            </div>
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9FB1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FF9FB1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Doanh thu']}
                    labelStyle={{ color: '#4b5563', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#DB2E50"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    activeDot={{ r: 6, fill: '#DB2E50', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
