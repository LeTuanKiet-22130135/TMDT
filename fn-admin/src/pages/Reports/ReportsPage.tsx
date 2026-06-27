import { useReports } from "./reports.logic";
import { CheckCircle2 } from "lucide-react";
import {
  Button, Badge, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";

function reportTypeBadge(type: string) {
  const map: Record<string, "warning" | "danger" | "info" | "default"> = {
    STORE_VIOLATION: "warning",
    CUSTOMER_VIOLATION: "danger",
    PRODUCT_VIOLATION: "info",
  };
  const labels: Record<string, string> = {
    STORE_VIOLATION: "Cửa hàng vi phạm",
    CUSTOMER_VIOLATION: "Người dùng vi phạm",
    PRODUCT_VIOLATION: "Sản phẩm vi phạm",
  };
  return <Badge variant={map[type] ?? "default"}>{labels[type] ?? type}</Badge>;
}

function reportStatusBadge(status: string) {
  const map: Record<string, "success" | "warning" | "default"> = {
    RESOLVED: "success",
    PENDING: "warning",
  };
  const labels: Record<string, string> = {
    RESOLVED: "Đã giải quyết",
    PENDING: "Chờ xử lý",
  };
  return <Badge variant={map[status] ?? "default"}>{labels[status] ?? status}</Badge>;
}

export default function ReportsPage() {
  const {
    reports,
    totalItems,
    totalPages,
    page,
    setPage,
    loading,
    handleResolve,
  } = useReports();

  return (
    <div className="p-6">
      <PageHeader
        title="Báo cáo vi phạm"
        subtitle={`${totalItems} báo cáo từ hệ thống`}
      />

      {loading ? (
        <LoadingSpinner />
      ) : reports.length === 0 ? (
        <EmptyState message="Không có báo cáo vi phạm nào cần xử lý" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Người báo cáo</Th>
                <Th>Đối tượng bị báo cáo</Th>
                <Th>Phân loại</Th>
                <Th>Lý do vi phạm</Th>
                <Th>Trạng thái</Th>
                <Th>Thời gian</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </Thead>
            <Tbody>
              {reports.map((report) => (
                <Tr key={report.id}>
                  <Td>
                    <p className="font-medium text-sm">{report.reporter.username}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {report.reporter.email}
                    </p>
                  </Td>
                  <Td>
                    {report.reportedStore ? (
                      <div>
                        <p className="font-semibold text-xs text-amber-500">Cửa hàng</p>
                        <p className="text-sm font-medium">{report.reportedStore.name}</p>
                      </div>
                    ) : report.reportedUser ? (
                      <div>
                        <p className="font-semibold text-xs text-blue-400">Người dùng</p>
                        <p className="text-sm font-medium">{report.reportedUser.username}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {report.reportedUser.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Không xác định</span>
                    )}
                  </Td>
                  <Td>{reportTypeBadge(report.reportType)}</Td>
                  <Td className="max-w-xs break-words text-sm">{report.reason}</Td>
                  <Td>{reportStatusBadge(report.status)}</Td>
                  <Td className="font-mono text-xs">
                    <span style={{ color: "var(--text-muted)" }}>
                      {formatDate(report.createdAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    {report.status !== "RESOLVED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(report.id)}
                        className="hover:border-emerald-500 hover:text-emerald-500"
                      >
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        Xử lý
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-emerald-500 flex items-center justify-end gap-1">
                        <CheckCircle2 size={13} />
                        Đã xử lý
                      </span>
                    )}
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
export { ReportsPage };
