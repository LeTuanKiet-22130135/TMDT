# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Lumine** — e-commerce platform for digital assets (illustrations, Live2D models). Monorepo with separate frontend, admin panel, and two backends.

## Monorepo layout

```
fn-tmdt/     # User-facing React frontend (port 5173)
fn-admin/    # Admin panel React frontend (port 5174)
bk-tmdt/     # Main FastAPI + GraphQL + PostgreSQL backend (port 8000)
bk-cacao/    # AI search/recommendation backend — FastAPI + LangChain + FAISS (port 8001)
docs/        # architecture.md — keep this updated when adding services/models
```

## Commands

### Frontend (fn-tmdt or fn-admin)
```bash
cd fn-tmdt   # or fn-admin
npm install
npm run dev         # dev server
npm run build       # tsc -b && vite build
npm run lint        # eslint
npm test            # vitest (run all)
npx vitest run src/pages/SomePage.test.tsx   # single test file
```

### Backend (bk-tmdt)
```bash
cd bk-tmdt
uv sync                              # install deps (uses uv)
# OR: pip install -r requirements.txt

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Migrations — required after any model change
alembic upgrade head
alembic revision --autogenerate -m "describe change"

# Tests (use SQLite in-memory, no DB needed)
python -m pytest tests/ -q
python -m pytest tests/test_sprint3.py tests/test_sprint4.py -q

# Seed sample data
python seed.py
```

### Backend (bk-cacao)
```bash
cd bk-cacao
uv sync
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Docker (full stack)
```bash
docker compose up          # production
docker compose -f docker-compose.dev.yml up   # dev
```

## Architecture

### API contract
- GraphQL (Strawberry) is the **primary** API. All frontend↔backend data fetching goes through `/graphql`.
- REST at `/api/v1/*` handles auth flows, file uploads, payment webhooks, and other non-query operations.
- Frontend Apollo client reads token from `localStorage.access_token` and sends `Authorization: Bearer`.

### bk-tmdt layers
```
app/models/entities.py      # SQLAlchemy ORM models
app/graphql/types.py        # Strawberry GraphQL types + Connection types
app/graphql/schema.py       # Query resolvers
app/graphql/mutations.py    # Mutation resolvers
app/crud/                   # DB query functions (called by resolvers)
app/api/                    # REST route handlers
app/schemas/                # Pydantic request/response schemas
```
Always use SQLAlchemy ORM — avoid raw SQL. If raw SQL is unavoidable, add a comment explaining why.

### bk-cacao
AI search service using LangChain + Ollama + FAISS vector store + Strawberry GraphQL. Handles semantic product search and recommendations.

### fn-tmdt / fn-admin pattern
- Business logic lives in `.logic.ts` files alongside pages — never inside components.
- Mock API data in `.logic.ts` when backend endpoint isn't ready.
- State via React Context only (no Redux/Zustand).
- `CartContext` at `src/contexts/CartContext.tsx`.
- Admin auth context at `fn-admin/src/lib/auth.tsx` — guards routes to `role=admin` only.

### Design tokens (fn-tmdt)
| Token | Value |
|---|---|
| Main | `#FFC9D2` |
| Accent | `#F65C88` |
| Background | `#FBFBFE` |
| Text | `#040316` |
| Prominent button gradient | `#FF9FB1` → `#DB2E50` |

Min padding: `5` spacing units. Style: Modern & Minimalist.

### Database
- PostgreSQL with `pgvector` extension (image: `pgvector/pgvector:pg16`)
- pgAdmin at port 5050 (local dev)
- Every model change requires a new Alembic migration before merging.

## Key rules

- All commits go to `dev` branch. Merge to `main` only when verified working.
- Always use GraphQL for frontend↔backend communication.
- Always update `docs/architecture.md` when adding services, models, or significant structural changes.
- New services must include a `Dockerfile`.
- **Never commit to Gitea. Do not use or modify Gitea workflows.**
