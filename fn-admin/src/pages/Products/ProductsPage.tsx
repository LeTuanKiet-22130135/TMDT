import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Search, ToggleLeft, ToggleRight } from "lucide-react";
import {
  Button, Badge, Input, LoadingSpinner, EmptyState, PageHeader,
  Pagination, Table, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui";
import { GET_ALL_PRODUCTS, TOGGLE_PRODUCT_MUTATION } from "@/services/graphql/admin.graphql";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  store: { id: string; name: string };
}

interface ProductsData {
  adminProducts: {
    items: Product[];
    totalItems: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, refetch } = useQuery<ProductsData>(GET_ALL_PRODUCTS, {
    variables: { page, limit: 20, q: search || null },
  });

  const [toggleProduct] = useMutation(TOGGLE_PRODUCT_MUTATION, {
    onCompleted: () => refetch(),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggle = (productId: string) => {
    toggleProduct({ variables: { productId } }).catch((err) => {
      console.error("Toggle product failed:", err);
    });
  };

  const products = data?.adminProducts.items ?? [];
  const totalPages = data?.adminProducts.totalPages ?? 1;

  return (
    <div className="p-6">
      <PageHeader
        title="Sản phẩm"
        subtitle={`${data?.adminProducts.totalItems ?? 0} sản phẩm`}
      />

      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Tìm theo tên sản phẩm..."
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
      ) : products.length === 0 ? (
        <EmptyState message="Không tìm thấy sản phẩm nào" />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Tên sản phẩm</Th>
                <Th>Cửa hàng</Th>
                <Th>Giá</Th>
                <Th>Tồn kho</Th>
                <Th>Trạng thái</Th>
                <Th className="text-right">Hành động</Th>
              </tr>
            </Thead>
            <Tbody>
              {products.map((product) => (
                <Tr key={product.id}>
                  <Td className="font-medium max-w-xs truncate">{product.name}</Td>
                  <Td className="font-mono text-xs" >
                  <span style={{ color: "var(--text-secondary)" }}>{product.store.name}
                  </span>
                  </Td>
                  <Td>{formatCurrency(product.price)}</Td>
                  <Td>
                    <Badge variant={product.stock > 0 ? "success" : "danger"}>
                      {product.stock}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge variant={product.isActive ? "success" : "default"}>
                      {product.isActive ? "Hiển thị" : "Ẩn"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(product.id)}
                    >
                      {product.isActive ? (
                        <>
                          <ToggleRight size={13} /> Ẩn
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={13} /> Hiện
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
