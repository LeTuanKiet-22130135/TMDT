import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Search, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Button, Badge, Input, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui";
import { GET_ALL_STORES, TOGGLE_STORE_MUTATION } from "@/services/graphql/admin.graphql";
import { formatDate } from "@/lib/utils";

interface Store {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; username: string; email: string };
}

interface StoresData {
  adminStores: {
    items: Store[];
    totalItems: number;
    totalPages: number;
  };
}

export default function StoresPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, refetch } = useQuery<StoresData>(GET_ALL_STORES, {
    variables: { page, limit: 20, q: search || null },
  });

  const [toggleStore] = useMutation(TOGGLE_STORE_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggle = (storeId: string) => {
    toggleStore({ variables: { storeId } }).catch((err) => {
      console.error("Toggle store failed:", err);
    });
  };

  const stores = data?.adminStores.items ?? [];
  const totalPages = data?.adminStores.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader
        title="Cửa hàng"
        subtitle={`${data?.adminStores.totalItems ?? 0} cửa hàng`}
      />

      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Tìm theo tên cửa hàng..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          leftIcon={<Search size={14} />}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : stores.length === 0 ? (
        <EmptyState message="Không tìm thấy cửa hàng nào" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Tên cửa hàng</Th>
                <Th>Chủ sở hữu</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </Thead>
            <Tbody>
              {stores.map((store) => (
                <Tr key={store.id}>
                  <Td className="font-medium">{store.name}</Td>
                  <Td>
                    <p className="text-sm">{store.owner.username}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {store.owner.email}
                    </p>
                  </Td>
                  <Td>
                    <Badge variant={store.isActive ? "success" : "danger"}>
                      {store.isActive ? "Đang hoạt động" : "Bị khóa"}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs" >
                  <span style={{ color: "var(--text-muted)" }}>{formatDate(store.createdAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(store.id)}
                    >
                      {store.isActive ? (
                        <>
                          <ToggleRight size={13} /> Khóa
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={13} /> Mở khóa
                        </>
                      )}
                    </Button>
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
