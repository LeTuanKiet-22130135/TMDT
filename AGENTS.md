# AGENTS.md — Lumine Project Context

## Tổng quan dự án

**Lumine** là một nền tảng thương mại điện tử chuyên bán **digital assets**, tập trung vào:

- **Tranh/ảnh tĩnh** (illustrations, concept art, wallpapers, digital paintings)
- **Live2D models** (character rigs, VTuber models, model components)

Người dùng có thể mua/bán trực tiếp hoặc đặt **custom request** (yêu cầu thiết kế theo đặt hàng).

---

## Cấu trúc monorepo

```
TMDT/
├── fn-tmdt/        # Frontend người dùng (React + Vite + TypeScript)
├── fn-admin/       # Frontend quản trị viên (React + Vite + TypeScript)
├── bk-tmdt/        # Backend chính (FastAPI + GraphQL + PostgreSQL)
├── bk-cacao/       # Backend phụ trợ
└── docs/           # Tài liệu kiến trúc
```

---

## Frontend người dùng (`fn-tmdt`)

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS v4, Radix UI, shadcn/ui
- **Icons**: `lucide-react`
- **Routing**: React Router v7
- **Data fetching**: Apollo Client (GraphQL) + Axios (REST)
- **i18n**: i18next — ngôn ngữ hiển thị **tiếng Việt**
- **State**: React Context (không dùng Redux/Zustand)

### Design system

| Token | Giá trị |
|---|---|
| Main | `#FFC9D2` |
| Secondary | `#FFAE98` |
| Accent | `#F65C88` |
| Background | `#FBFBFE` |
| Text | `#040316` |
| Gradient BG | `#FFAFB1` → `#FFFFFF` |
| Accent gradient | `#FFAFB1` → `#9AC6FF` |
| Prominent button | `#FF9FB1` → `#DB2E50` |

Style tổng thể: **Modern & Minimalist** — thoáng, sạch, ưu tiên usability.

### Quy tắc code UI

- Tách business logic ra file `.logic.ts` riêng, **không** để trong component
- Nếu API chưa sẵn, mock data trong file `.logic.ts` riêng
- Tách component nhỏ, tái sử dụng — không viết toàn bộ UI trong 1 file
- Padding tối thiểu `5` (spacing units)

---

## Backend (`bk-tmdt`)

- **Framework**: FastAPI
- **API**: GraphQL (Strawberry) + REST
- **ORM**: SQLAlchemy + Alembic (migrations)
- **DB**: PostgreSQL

---

## Frontend admin (`fn-admin`)

- Cùng stack với `fn-tmdt`
- Quản lý: users, stores, products, orders, reports, dashboard

---

## Domain chính

| Khái niệm | Mô tả |
|---|---|
| **Asset / Product** | File digital (tranh tĩnh, Live2D model) được bán |
| **Store** | Gian hàng của seller |
| **Custom Request** | Đơn đặt hàng thiết kế theo yêu cầu |
| **Cart** | Giỏ hàng (CartContext, mock data sẵn) |
| **Order** | Đơn hàng sau khi thanh toán |
