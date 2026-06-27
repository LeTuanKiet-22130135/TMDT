# CLAUDE.md

**Lumine** — e-commerce digital assets (illustrations, Live2D). Monorepo.

## Layout
```
fn-tmdt/    # React frontend (5173)
fn-admin/   # Admin React (5174)
bk-tmdt/    # FastAPI + GraphQL + PostgreSQL (8000)
bk-cacao/   # AI search — LangChain + FAISS (8001)
docs/       # architecture.md — update when adding services/models
```

## Commands

**Frontend** (fn-tmdt or fn-admin)
```bash
npm install
npm run dev
npm run build    # tsc -b && vite build
npm run lint
npm test         # vitest
npx vitest run src/pages/SomePage.test.tsx
```

**bk-tmdt**
```bash
uv sync
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
alembic upgrade head
alembic revision --autogenerate -m "describe change"
python -m pytest tests/ -q
python seed.py
```

**bk-cacao**
```bash
uv sync
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Docker**
```bash
docker compose up
docker compose -f docker-compose.dev.yml up
```

## Architecture

**API:** GraphQL (Strawberry) primary — all data via `/graphql`. REST `/api/v1/*` for auth/uploads/webhooks. Frontend reads `localStorage.access_token` → `Authorization: Bearer`.

**bk-tmdt layers:**
```
app/models/entities.py     # SQLAlchemy ORM
app/graphql/types.py       # Strawberry types + Connection types
app/graphql/schema.py      # Query resolvers
app/graphql/mutations.py   # Mutation resolvers
app/crud/                  # DB queries
app/api/                   # REST handlers
app/schemas/               # Pydantic schemas
```
Use SQLAlchemy ORM. Raw SQL only if unavoidable — add comment why.

**bk-cacao:** LangChain + Ollama + FAISS + Strawberry GraphQL. Semantic search + recommendations.

**fn-tmdt / fn-admin:**
- Logic in `.logic.ts` beside pages — never in components
- Mock API in `.logic.ts` when backend not ready
- State: React Context only (no Redux/Zustand)
- `CartContext` → `src/contexts/CartContext.tsx`
- Admin auth → `fn-admin/src/lib/auth.tsx` (role=admin only)

**Design tokens (fn-tmdt):**
- Main `#FFC9D2` · Accent `#F65C88` · BG `#FBFBFE` · Text `#040316`
- Button gradient `#FF9FB1` → `#DB2E50`
- Min padding: 5 units. Style: Modern & Minimalist.

**DB:** PostgreSQL + pgvector (`pgvector/pgvector:pg16`). pgAdmin port 5050. Every model change needs Alembic migration.

## Project Skills

Skills live in `.agent/skills/<name>/SKILL.md`. Hook auto-injects index each prompt.

Use skill: read `.agent/skills/<name>/SKILL.md`, follow instructions.

Add skill: create `.agent/skills/<name>/SKILL.md`:
```
---
name: skill-name
description: One-line summary
---
```
Auto-detected next prompt. No registration needed.

## Rules

- Commits → `dev`. Merge `main` only when verified.
- GraphQL for all frontend↔backend data.
- Update `docs/architecture.md` when adding services/models/structure.
- New services need `Dockerfile`.
- **Never commit to Gitea. Never touch Gitea workflows.**

## CRITICAL ARCHITECTURE RULES:
1. DO NOT group all logic into one giant file ("God file").
2. Enforce structural modularity: Split the implementation into separate files/modules based on functional layers (e.g., core logic, UI layout, data/types).
3. Keep each file lightweight and highly focused (under 150-200 lines if possible).
4. When creating or refactoring code, explicitly output the folder structure and state which code goes into which file clearly.