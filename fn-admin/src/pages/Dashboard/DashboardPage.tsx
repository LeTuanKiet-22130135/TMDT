import { useQuery } from "@apollo/client/react";
import { Users, Package, ShoppingCart, Store, TrendingUp, Clock } from "lucide-react";
import { Card, LoadingSpinner, PageHeader } from "@/components/ui";
import { GET_ADMIN_STATS } from "@/services/graphql/admin.graphql";
import { formatCurrency } from "@/lib/utils";

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

  const stats = data?.adminStats;

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
    </div>
  );
}
