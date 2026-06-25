# Kiến trúc hệ thống — Lumine

E-commerce digital assets (illustrations, Live2D). Monorepo.

## Tổng quan

```
fn-tmdt/    # React frontend người dùng         :5173
fn-admin/   # React frontend admin              :5174
bk-tmdt/    # FastAPI + GraphQL + PostgreSQL     :8000
bk-cacao/   # AI search — LangChain + FAISS      :8001
db-tools/   # CLI backup/restore DB + uploads
docs/       # Tài liệu kỹ thuật
```

**API chính:** GraphQL (`/graphql`) — toàn bộ data frontend ↔ backend đi qua đây.  
**REST** (`/api/v1/*`) — chỉ dùng cho auth (login/register), upload file, webhook.

---

## Frontend

### fn-tmdt

React (Vite + TypeScript), port 5173 (dev).

**Stack:**
- Tailwind CSS v4
- Apollo Client 4.x — **2 client riêng biệt:**
  - `client` (`src/apollo.ts`) → bk-tmdt port 8000, kèm `Authorization: Bearer <token>`
  - `cacaoClient` (`src/apollo.ts`) → bk-cacao port 8001, không cần auth
- react-router-dom v7
- react-responsive-masonry (trang chủ)
- lucide-react

**Cấu trúc thư mục:**

```
src/
  apollo.ts                   # Khởi tạo client + cacaoClient
  contexts/
    UserProfileContext.tsx     # Auth state toàn cục, notifyLogin() sau đăng nhập
    CartContext.tsx
  graphql/                    # GraphQL queries/mutations (theo feature)
    profile.ts                # ME_QUERY, AUTHOR_QUERY, UPDATE_SHORTLINK_MUTATION
    suggestions.ts            # SUGGESTIONS_QUERY (bk-cacao)
  components/
    layout/                   # Header, Sidebar, BottomNav
    ui/                       # Badge, Button, Input, LoadingSlime, ...
    Auth/                     # LoginModal, RegisterModal
  pages/
    Home/                     # Trang chủ — infinite scroll từ bk-cacao
    Author/                   # Trang tác giả /author/:shortlink
    CreateProduct/            # Đăng sản phẩm
    Profile/                  # Chỉnh sửa hồ sơ cá nhân
    ProductDetailPage.tsx
    CustomRequestsPage.tsx
```

**Quy tắc:**
- Logic nghiệp vụ trong `.logic.ts` — không đặt trong component
- State dùng React Context, không dùng Redux/Zustand
- `isAuthenticated` lấy từ `UserProfileContext`, gọi `notifyLogin()` sau login để cập nhật UI ngay không cần F5

**Design tokens:**
- Main `#FFC9D2` · Accent `#F65C88` · BG `#FBFBFE` · Text `#040316`
- Button gradient `#FF9FB1` → `#DB2E50`
- Padding tối thiểu 5 units

---

### fn-admin

React (Vite + TypeScript), port 5174 (dev).

**Stack:** Tailwind CSS v4, Apollo Client, lucide-react, react-router-dom v7

**Cấu trúc thư mục:**

```
src/
  lib/auth.tsx                # Auth context, chỉ cho role=admin
  components/
    layout/                   # Sidebar, AdminLayout
    ui/                       # Button, Badge, Table, Pagination, Card
    Auth/                     # ProtectedRoute
  pages/
    Dashboard/                # Thống kê tổng quan
    Users/                    # Quản lý user (ban/unban)
    Products/                 # Quản lý sản phẩm (ẩn/hiện)
    Orders/                   # Quản lý đơn hàng
    Stores/                   # Quản lý cửa hàng (khóa/mở)
    Reports/                  # Xử lý báo cáo vi phạm
  services/graphql/           # GraphQL queries & mutations cho admin
```

---

## Backend

### bk-tmdt

FastAPI + Strawberry GraphQL + PostgreSQL, port 8000.

**Layers:**

```
app/
  models/entities.py          # SQLAlchemy ORM — source of truth cho schema
  graphql/
    types.py                  # Strawberry types + Connection types
    schema.py                 # Query resolvers
    mutations.py              # Mutation resolvers
  api/v1/
    auth.py                   # POST /api/v1/auth/login, /register
    uploads.py                # POST /api/v1/uploads — lưu file vào uploads/
    internal.py               # Internal endpoints
  crud/                       # DB queries tái sử dụng
  schemas/                    # Pydantic request/response schemas
alembic/                      # Migrations — bắt buộc khi thay đổi model
uploads/                      # File storage (ảnh sản phẩm, avatar)
```

**Models chính:**

| Model | Ghi chú |
|---|---|
| `User` | `shortlink` (32 ký tự, unique), `is_gold`, `is_verified`, `avatar_url` |
| `Store` | Tự động tạo khi user đăng ký |
| `Product` | `image_urls` (JSONB), `user_tags`, `ai_tags`, `license_type` |
| `Order`, `OrderItem` | |
| `Cart`, `CartItem` | |
| `Report` | Báo cáo vi phạm |

**Shortlink system:**
- Mỗi user có `shortlink` duy nhất (10 ký tự alphanumeric random)
- Trang tác giả: `/author/:shortlink`
- Tài khoản free: shortlink ngẫu nhiên, không đổi được
- Tài khoản gold (`is_gold=true`): đổi được, tối đa 32 ký tự, mutation `updateShortlink`

**Quy tắc:**
- Dùng SQLAlchemy ORM, raw SQL chỉ khi thực sự cần (ghi chú lý do)
- Mọi thay đổi model → tạo Alembic migration
- Exception messages bằng tiếng Việt

---

### bk-cacao

AI Search & Recommendations, port 8001.

**Stack:** FastAPI + Strawberry GraphQL, LangChain + Ollama, FAISS, ONNX Runtime, uv

**Kiến trúc:**

```
main.py                       # FastAPI app, không có SQLite init
app/
  database.py                 # PostgreSQL session (đọc chung DB với bk-tmdt)
  models.py                   # ORM read-only: Product, Store, User
  schema.py                   # GraphQL schema
  agent.py                    # LangChain agent + extract_search_query
  vector_store.py             # FAISS index (all-MiniLM-L6-v2)
  routes/
    tagging.py                # REST: ONNX image auto-tagging
```

**GraphQL queries:**

| Query/Mutation | Mô tả |
|---|---|
| `suggestions(offset, limit)` | Danh sách sản phẩm cho trang chủ (infinite scroll) |
| `suggestions_count` | Tổng số sản phẩm active |
| `search_products_by_ai(prompt)` | Semantic search qua FAISS + LLM extract params |
| `ask_ai(prompt)` | LangChain agent trả lời tự nhiên |

**Lưu ý:**
- Chỉ đọc từ PostgreSQL của bk-tmdt (không ghi)
- Không có SQLite — đã xóa hoàn toàn
- Kết nối DB qua env `TMDT_DB_URL`

---

## Database

PostgreSQL 16 + pgvector (`pgvector/pgvector:pg16`), port 5432.  
Container: `tmdt_db`. pgAdmin tại port 5050.

**Quản lý schema:** Alembic (trong `bk-tmdt/alembic/`).  
**Migrations quan trọng:**
- `category_id` nullable (SET NULL on delete)
- `shortlink`, `is_gold` trên bảng users

---

## db-tools

CLI backup/restore database và file storage. Xem hướng dẫn đầy đủ: [`db-tools.md`](./db-tools.md)

```
db-tools/
  main.py          # CLI: export / import
  src/
    config.py      # Cấu hình từ .env
    exporter.py    # pg_dump + uploads → .tar.gz
    importer.py    # Giải nén → tạo DB → psql restore → copy files
  .env.example
```

**Lệnh nhanh:**

```bash
cd db-tools

# Xuất backup
uv run python main.py export --output-dir ./backups

# Khôi phục vào tmdt-backup (không đụng production)
uv run python main.py import backups/tmdt_backup_YYYYMMDD_HHMMSS.tar.gz
```

---

## Docker

```yaml
# docker-compose.yml (production)
services:
  db:        pgvector/pgvector:pg16  :5432
  bk-tmdt:   ./bk-tmdt               :8000
  bk-cacao:  ./bk-cacao              :8001
  pgadmin:   dpage/pgadmin4          :5050
```

Mỗi service mới cần có `Dockerfile`.

---

## Quy ước

- Commit vào branch `dev`. Merge `main` khi đã verify.
- Không commit lên Gitea, không chỉnh workflow Gitea.
- Update file này khi thêm service, model mới, hoặc thay đổi cấu trúc lớn.
