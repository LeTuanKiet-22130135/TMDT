import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Badge, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui";
import { GET_ALL_ORDERS } from "@/services/graphql/admin.graphql";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  buyer: { id: string; username: string; email: string };
}

interface OrdersData {
  adminOrders: {
    items: Order[];
    totalItems: number;
    totalPages: number;
  };
}

const STATUS_FILTERS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Đang xử lý", value: "processing" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã hủy", value: "cancelled" },
];

function orderStatusBadge(status: string) {
  const map: Record<string, "warning" | "info" | "success" | "danger" | "default"> = {
    pending: "warning",
    processing: "info",
    completed: "success",
    cancelled: "danger",
  };
  const labels: Record<string, string> = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };
  return <Badge variant={map[status] ?? "default"}>{labels[status] ?? status}</Badge>;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, loading } = useQuery<OrdersData>(GET_ALL_ORDERS, {
    variables: { page, limit: 20, status: statusFilter || null },
  });

  const orders = data?.adminOrders.items ?? [];
  const totalPages = data?.adminOrders.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader
        title="Đơn hàng"
        subtitle={`${data?.adminOrders.totalItems ?? 0} đơn hàng`}
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={
              statusFilter === value
                ? { background: "var(--accent)", color: "white" }
                : { background: "var(--surface-raised)", color: "var(--text-secondary)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <EmptyState message="Không tìm thấy đơn hàng nào" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Mã đơn</Th>
                <Th>Khách hàng</Th>
                <Th>Tổng tiền</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày đặt</Th>
              </tr>
            </Thead>
            <Tbody>
  {orders.map((order) => (
    <Tr key={order.id}>
      <Td className="font-mono text-xs">
        <span style={{ color: "var(--text-muted)" }}>
          {order.id.slice(0, 8)}...
        </span>
      </Td>
      <Td>
        <p className="font-medium text-sm">{order.buyer.username}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {order.buyer.email}
        </p>
      </Td>
      <Td className="font-medium">{formatCurrency(order.totalAmount)}</Td>
      <Td>{orderStatusBadge(order.status)}</Td>
      <Td>
        <span style={{ color: "var(--text-muted)" }}>
          {formatDate(order.createdAt)}
        </span>
      </Td>
    </Tr>
  ))}
</Tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
