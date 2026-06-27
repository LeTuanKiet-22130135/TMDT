import { useQuery } from "@apollo/client/react";
import { Users, Package, ShoppingCart, Store, TrendingUp, Clock } from "lucide-react";
import { Card, LoadingSpinner, PageHeader } from "@/components/ui";
import { GET_ADMIN_STATS } from "@/services/graphql/admin.graphql";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useDashboardLogic } from "./Dashboard.logic";

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalStores: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface StatsData {
  adminStats: AdminStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            {label}
          </p>
          <p className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
        </div>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ background: `${color}20`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, loading } = useQuery<StatsData>(GET_ADMIN_STATS);
  const { timePeriod, setTimePeriod, chartData, monthlyCategoryRevenue, isLoadingCharts } = useDashboardLogic();

  const stats = data?.adminStats;

  const hasRevenueData = chartData && chartData.length > 0 && chartData.some((d: any) => d.revenue > 0);
  const hasCategoryData = monthlyCategoryRevenue && monthlyCategoryRevenue.length > 0 && monthlyCategoryRevenue.some((d: any) => d.value > 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan hệ thống Lumine"
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            label="Tổng người dùng"
            value={stats?.totalUsers ?? "—"}
            icon={Users}
            color="var(--accent)"
          />
          <StatCard
            label="Tổng sản phẩm"
            value={stats?.totalProducts ?? "—"}
            icon={Package}
            color="var(--info)"
          />
          <StatCard
            label="Tổng đơn hàng"
            value={stats?.totalOrders ?? "—"}
            icon={ShoppingCart}
            color="var(--success)"
          />
          <StatCard
            label="Đơn chờ xử lý"
            value={stats?.pendingOrders ?? "—"}
            icon={Clock}
            color="var(--warning)"
          />
          <StatCard
            label="Tổng cửa hàng"
            value={stats?.totalStores ?? "—"}
            icon={Store}
            color="var(--info)"
          />
          <StatCard
            label="Doanh thu"
            value={stats?.totalRevenue != null ? formatCurrency(stats.totalRevenue) : "—"}
            icon={TrendingUp}
            color="var(--success)"
          />
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Thống kê doanh thu cửa hàng
              </h3>
              <select
                className="border rounded-md px-3 py-1.5 text-sm outline-none transition-colors"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as any)}
                style={{
                  borderColor: "var(--border)",
                  background: "var(--surface-raised)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="7days">7 ngày qua</option>
                <option value="30days">30 ngày qua</option>
                <option value="year">Năm nay</option>
              </select>
            </div>
            <div style={{ width: "100%", height: 350 }}>
              {isLoadingCharts ? (
                <div className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : !hasRevenueData ? (
                <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
                  <ShoppingCart size={48} className="mb-4 opacity-20" />
                  <p>Không có đơn hàng nào trong khoảng thời gian này</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    tickFormatter={(value) => (value > 0 ? `${value / 1000000}M` : '0')}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--border)", opacity: 0.2 }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      backgroundColor: "var(--surface-raised)",
                      color: "var(--text-primary)"
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), "Doanh thu"]}
                    labelStyle={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: 4 }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--accent)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
              Doanh thu theo danh mục (Tháng này)
            </h3>
            <div style={{ width: "100%", height: 350 }}>
              {isLoadingCharts ? (
                <div className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : !hasCategoryData ? (
                <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: "var(--text-muted)" }}>
                  <Package size={48} className="mb-4 opacity-20" />
                  <p>Không có dữ liệu trong khoảng thời gian này</p>
                </div>
              ) : (
                <ResponsiveContainer>
                  <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <Pie
                    data={monthlyCategoryRevenue}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {monthlyCategoryRevenue.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      backgroundColor: "var(--surface-raised)",
                      color: "var(--text-primary)"
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value) || 0), "Doanh thu"]}
                    itemStyle={{ color: "var(--text-primary)", fontWeight: 500 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
