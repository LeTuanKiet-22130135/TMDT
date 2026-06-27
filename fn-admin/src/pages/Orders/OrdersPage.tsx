import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { FileDown } from "lucide-react";
import {
  Badge, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td, Button,
} from "@/components/ui";
import { GET_ALL_ORDERS } from "@/services/graphql/admin.graphql";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  type Order, type OrdersData,
  STATUS_FILTERS, STATUS_LABELS, STATUS_BADGE_MAP,
  maskName, maskEmail, exportToExcel,
} from "./OrdersPage.logic";
import { MOCK_ORDERS } from "./__tests__/mockData";

function orderStatusBadge(status: string) {
  return (
    <Badge variant={STATUS_BADGE_MAP[status] ?? "default"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { user } = useAuth();

  const { data, loading } = useQuery<OrdersData>(GET_ALL_ORDERS, {
    variables: { page, limit: 20, status: statusFilter || null },
  });

  const filteredMock = statusFilter
    ? MOCK_ORDERS.filter((o) => o.status === statusFilter)
    : MOCK_ORDERS;
  const displayOrders: Order[] = data?.adminOrders.items ?? filteredMock;
  const totalPages = data?.adminOrders.totalPages ?? 1;
  const totalItems = data?.adminOrders.totalItems ?? MOCK_ORDERS.length;

  const handleExport = () => {
    exportToExcel({
      orders: displayOrders,
      statusFilter,
      generatedBy: user ? `${user.fullName} (${user.email})` : "Admin",
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Giao dịch"
        subtitle={`${totalItems} giao dịch`}
        action={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <FileDown size={14} />
            Xuất Excel
          </Button>
        }
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
      ) : displayOrders.length === 0 ? (
        <EmptyState message="Không tìm thấy giao dịch nào" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Mã giao dịch</Th>
                <Th>Khách hàng</Th>
                <Th>Số tiền</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày giao dịch</Th>
              </tr>
            </Thead>
            <Tbody>
              {displayOrders.map((order) => (
                <Tr key={order.id}>
                  <Td className="font-mono text-xs">
                    <span style={{ color: "var(--text-muted)" }}>
                      {order.id.slice(0, 8).toUpperCase()}...
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium text-sm">{maskName(order.buyer.username)}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {maskEmail(order.buyer.email)}
                    </p>
                  </Td>
                  <Td className="font-medium">{formatCurrency(order.totalAmount)}</Td>
                  <Td>{orderStatusBadge(order.status)}</Td>
                  <Td> <span style={{ color: "var(--text-muted)" }}>{formatDate(order.createdAt)}</span></Td>
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