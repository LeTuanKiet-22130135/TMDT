# Frontend
## fn-tmdt
- Reactjs (Vite + TypeScript)
- Tailwind CSS v4
- lucide-react
- react-router-dom (v7)
- Cấu trúc thư mục:
  - `src/components/layout`: Chứa Header, Sidebar, BottomNav
  - `src/components/ui`: Chứa các component dùng chung (Badge, Button, Input, SparkButton, CommentsModal)
  - `src/pages/Home`: Trang chủ hiển thị danh sách tài nguyên và logic xử lý dữ liệu (`home.logic.ts`)
  - `src/pages/ProductDetailPage.tsx`: Trang chi tiết tài nguyên và các bình luận
  - `src/pages/CustomRequestsPage.tsx`: Trang Ticket / Chat yêu cầu custom của khách hàng


## fn-admin
Reactjs (Vite + TypeScript)
Tailwind CSS v4
Apollo Client (GraphQL)
lucide-react
react-router-dom (v7)
Port: 5174 (dev), 80 (Docker)
Cấu trúc thư mục:

src/components/layout: Chứa Sidebar, AdminLayout
src/components/ui: Chứa các component dùng chung (Button, Badge, Input, Table, Pagination, Card)
src/components/Auth: Chứa ProtectedRoute (chỉ cho role=admin)
src/lib/auth.tsx: Auth context quản lý token và user state
src/pages/Dashboard: Trang tổng quan thống kê hệ thống
src/pages/Users: Quản lý người dùng (ban/unban)
src/pages/Products: Quản lý sản phẩm (ẩn/hiện)
src/pages/Orders: Quản lý đơn hàng (filter theo status)
src/pages/Stores: Quản lý cửa hàng (khóa/mở)
src/pages/Reports: Quản lý báo cáo vi phạm (xem, lọc và xử lý báo cáo)
src/services/graphql: GraphQL queries & mutations cho admin


# Backend
- GraphQL là phương thức giao tiếp API chính thống nhất giữa Frontend và Backend.
- Sử dụng ORM (SQLAlchemy) cho toàn bộ tương tác cơ sở dữ liệu.

## bk-tmdt
- FastAPI (Python) làm Web Framework.
- Strawberry làm GraphQL Library phục vụ xây dựng Schema, Query và Mutation.
- SQLAlchemy làm ORM kết nối DB.
- Cấu trúc thư mục chính:
  - `app/graphql/types.py`: Định nghĩa các GraphQL Type tương ứng với Model và Connection Types (ví dụ: `UserConnection`, `ReportConnection`).
  - `app/graphql/schema.py`: Chứa các GraphQL Query chính (ví dụ: `adminStats`, `adminReports`).
  - `app/graphql/mutations.py`: Chứa các GraphQL Mutation nghiệp vụ (ví dụ: `banUser`, `resolveReport`).
  - `app/models/`: Định nghĩa các Model SQLAlchemy (ví dụ: `User`, `Store`, `Report`, `Product`, `Order`).
  - `tests/`: Chứa các bài kiểm thử GraphQL API sử dụng pytest và SQLite in-memory engine.

## bk-cacao
- python
- uv package manager
- onnx-runtime
- langchain

## nginx
- cấu hình load balance cho service, ví dụ frontend.

## database
- pgvector
