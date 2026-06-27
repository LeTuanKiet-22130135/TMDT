# bk-cacao AI Search & Recommendation Engine

This folder contains the AI-powered search and recommendation backend for the TMDT marketplace.

## What this backend provides

- FastAPI app entrypoint at `main.py`
- LangChain + Ollama integration for AI agent tasks (e.g., extracting search parameters)
- PostgreSQL + `pgvector` for semantic similarity search
- Strawberry GraphQL for fetching suggestions, semantic search, and personalized recommendations
- Content-based recommendation engine with weighted user profiles (based on view, cart, search, and purchase events)

## Requirements

- Python 3.13
- PostgreSQL with the `pgvector` extension installed
- Ollama running locally (or remotely) with the `llama3` model (or another configured model)
- Recommended to use `uv` for dependency management

## Install

From the `bk-cacao` folder:

Using `uv` (recommended):
```powershell
uv sync
```

Alternatively, using standard `pip`:
```powershell
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

## Environment variables

Create or edit `.env` in `bk-cacao`:

```env
TMDT_DB_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/tmdt
OLLAMA_API=http://localhost:11434
MODEL=llama3
```

Where to put each key:

- `TMDT_DB_URL`: Connection string to the same database as `bk-tmdt`. Ensure you use the exact same credentials.
- `OLLAMA_API`: The URL where your Ollama instance is hosted.
- `MODEL`: The name of the LLM model pulled in Ollama (e.g., `llama3`).

## Database setup

Unlike `bk-tmdt` which uses Alembic, `bk-cacao` automatically ensures its specific tables (`UserRedProfile`, `ProductRedProfile`) and the `vector` extension exist when the app starts up. It also automatically applies idempotent migrations for `pgvector` columns and `hnsw` indexes via the lifespan events in `main.py`.

You still need to have run the Alembic migrations in `bk-tmdt` first to ensure the core `Product`, `Store`, and `User` tables exist.

## Run the backend

Recommended:

```powershell
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at:

- `http://127.0.0.1:8001`
- Swagger UI (REST endpoints): `http://127.0.0.1:8001/docs`
- GraphQL endpoint: `http://127.0.0.1:8001/graphql`

## How the frontend should call it

- Base path: `/api/v1` for REST endpoints (e.g., `/api/v1/tagging`)
- GraphQL: `/graphql` for queries and mutations.

Unlike the main backend, most `bk-cacao` endpoints do not currently enforce JWT authentication, but they do accept a `userId` parameter in GraphQL to fetch personalized recommendations or track events.

## Main API groups

- Tagging (REST): `/api/v1/tagging`
- GraphQL: `/graphql`

## GraphQL quick start

The GraphQL endpoint supports semantic searching, filtering, and personalized recommendations.

Available GraphQL queries:

- `suggestions(offset, limit)`
- `suggestions_count`
- `searchProductsByAi(prompt)`: Uses LangChain to parse natural language and filter products.
- `semanticSearchProducts(query, limit)`: Uses `pgvector` for semantic similarity.
- `filteredSuggestions(...)`
- `personalizedRecommendations(userId, limit)`

Available GraphQL mutations:

- `askAi(prompt)`
- `trackEvent(userId, productId, eventType)`
- `indexProduct(productId)`
- `rebuildProductProfiles`

Example query for personalized recommendations:

```graphql
query Personalized {
	personalizedRecommendations(userId: "some-uuid-here", limit: 10) {
		id
		name
		price
		imageUrl
		tags
		authorName
	}
}
```

Example semantic search query:

```graphql
query SemanticSearch {
	semanticSearchProducts(query: "cyberpunk city background", limit: 5) {
		id
		name
		price
	}
}
```

Example mutation to track a user event (to improve recommendations):

```graphql
mutation Track {
	trackEvent(userId: "user-uuid", productId: "product-uuid", eventType: "view")
}
```
*(Valid event types: `view`, `cart`, `search`, `follow`, `purchase`)*

## Notes for the frontend dev

- `bk-cacao` relies on the `pgvector` profiles generated when products are created or when `trackEvent` is called.
- For search inputs that are natural language (e.g., "cheap 3D models under 50"), use `searchProductsByAi` which leverages the LLM to extract filters like `min_price` and `max_price`.
- Ensure the Ollama service is running on the specified `OLLAMA_API` port before testing AI search features.
