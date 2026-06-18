# fn-admin

Frontend admin panel cho hệ thống Lumine, xây dựng bằng React + Vite + TypeScript.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** (bundler + dev server)
- **Tailwind CSS v4**
- **Apollo Client** (GraphQL)
- **React Router v7**
- **Lucide React** (icons)
- **Vitest** + Testing Library (tests)

## Cấu trúc thư mục

```
src/
├── apollo.ts              # Apollo Client setup
├── App.tsx                # Router & layout
├── components/
│   ├── Auth/
│   │   └── ProtectedRoute.tsx
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   └── Sidebar.tsx
│   └── ui/
│       └── index.tsx      # Shared components (Button, Badge, Table, ...)
├── lib/
│   ├── auth.tsx           # Auth context
│   └── utils.ts
├── pages/
│   ├── Auth/LoginPage.tsx
│   ├── Dashboard/DashboardPage.tsx
│   ├── Users/UsersPage.tsx
│   ├── Products/ProductsPage.tsx
│   ├── Orders/OrdersPage.tsx
│   └── Stores/StoresPage.tsx
└── services/
    └── graphql/
        └── admin.graphql.ts   # GraphQL queries & mutations
```

## Cài đặt & chạy

```bash
npm install
npm run dev       # http://localhost:5174
npm run build
npm run test
```

## Docker

```bash
docker build -t fn-admin .
docker run -p 8080:80 fn-admin
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `VITE_GRAPHQL_URL` | URL GraphQL endpoint | `http://localhost:8000/graphql` |

## Pages

| Route | Trang |
|-------|-------|
| `/login` | Đăng nhập admin |
| `/` | Dashboard tổng quan |
| `/users` | Quản lý người dùng |
| `/products` | Quản lý sản phẩm |
| `/orders` | Quản lý đơn hàng |
| `/stores` | Quản lý cửa hàng |
