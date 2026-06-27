import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Search, UserX, UserCheck } from "lucide-react";
import {
  Button, Badge, Input, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui";
import {
  GET_ALL_USERS,
  BAN_USER_MUTATION,
  UNBAN_USER_MUTATION,
} from "@/services/graphql/admin.graphql";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersData {
  adminUsers: {
    items: User[];
    totalItems: number;
    totalPages: number;
  };
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, refetch } = useQuery<UsersData>(GET_ALL_USERS, {
    variables: { page, limit: 20, q: search || null },
  });

  const [banUser] = useMutation(BAN_USER_MUTATION, {
    onCompleted: () => refetch(),
  });

  const [unbanUser] = useMutation(UNBAN_USER_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleBan = (user: User) => {
    const mutation = user.isActive ? banUser : unbanUser;
    mutation({ variables: { userId: user.id } }).catch((err) => {
      console.error("Toggle ban failed:", err);
    });
  };

  const users = data?.adminUsers.items ?? [];
  const totalPages = data?.adminUsers.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader
        title="Người dùng"
        subtitle={`${data?.adminUsers.totalItems ?? 0} tài khoản`}
      />

      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Tìm theo tên, email..."
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
      ) : users.length === 0 ? (
        <EmptyState message="Không tìm thấy người dùng nào" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Tên đăng nhập</Th>
                <Th>Email</Th>
                <Th>Vai trò</Th>
                <Th>Trạng thái</Th>
                <Th>Ngày tạo</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </Thead>
            <Tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td className="font-medium">{user.username}</Td>
                  <Td>
                    <span style={{ color: "var(--text-secondary)" }}>{user.email}</span>
                  </Td>
                  <Td>
                    <Badge variant={user.role === "admin" ? "info" : "default"}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Hoạt động" : "Bị khóa"}
                    </Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    <span style={{ color: "var(--text-muted)" }}>{formatDate(user.createdAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant={user.isActive ? "danger" : "ghost"}
                      size="sm"
                      onClick={() => handleToggleBan(user)}
                      disabled={user.role === "admin"}
                    >
                      {user.isActive ? (
                        <>
                          <UserX size={13} /> Khóa
                        </>
                      ) : (
                        <>
                          <UserCheck size={13} /> Mở khóa
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
