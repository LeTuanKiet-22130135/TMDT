# bk-tmdt Backend Run Guide

This folder contains the FastAPI backend for the TMDT marketplace.

## What this backend provides

- FastAPI app entrypoint at `app/main.py`
- SQLAlchemy 2 ORM models
- PostgreSQL as the target database
- JWT authentication with access and refresh tokens
- Core marketplace flows for auth, stores, products, cart, orders, payments, social, admin, and seller analytics

## Requirements

- Python 3.13
- PostgreSQL running locally or remotely
- A Python virtual environment is recommended

## Install

From the `bk-tmdt` folder:

```powershell
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
```

If you already have a workspace-level virtual environment, you can use that instead of creating a new one.

Note: GraphQL support is included in `requirements.txt` via `strawberry-graphql[fastapi]`.

## Environment variables

Create or edit `.env` in `bk-tmdt`:

```env
DB_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/tmdt
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
VERIFICATION_TOKEN_EXPIRE_MINUTES=60
RESET_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["*"]
REWARD_POINTS_EARN_THRESHOLD_VND=100000
REWARD_POINT_VALUE_VND=1000
WEBHOOK_SECRET=change-me
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
PAYMENT_API_KEY=
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@tmdt.com
```

Frontend note: `CORS_ORIGINS` is currently open, so local frontend dev servers can call the API without extra CORS work.

Where to put each key:

- Database connection string: `DB_URL`
- Third-party login credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- Payment provider API key: `PAYMENT_API_KEY`
- Payment webhook secret: `WEBHOOK_SECRET`
- Email delivery credentials: `SMTP_*`

## Database setup

Create the PostgreSQL database first, then run migrations:

```powershell
alembic upgrade head
```

If you need a clean sample dataset for manual testing, run:

```powershell
python seed.py
```

The seed script creates sample admin, buyer, seller, store, categories, products, orders, reviews, comments, and reports.

Important: any time you change or add fields, relationships, enums, or other ORM model definitions in `app/models/`, generate a new Alembic migration before merging or handing the change off.

## Run the backend

Recommended:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Alternative:

```powershell
python app/main.py
```

If your shell is not using the correct virtual environment, run with an explicit interpreter path:

```powershell
c:/Users/lekie/Documents/GitHub/TMDT/.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:

- `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI schema: `http://127.0.0.1:8000/openapi.json`
- GraphQL endpoint: `http://127.0.0.1:8000/graphql`

## How the frontend should call it

- Base path: `/api/v1`
- Auth header: `Authorization: Bearer <access_token>`
- Login returns access and refresh tokens
- Most seller, admin, cart, order, payment, and social actions require an authenticated user

## Main API groups

- Auth: `/api/v1/auth`
- Stores: `/api/v1/stores`
- Products: `/api/v1/products`
- Cart: `/api/v1/cart`
- Orders: `/api/v1/orders`
- Payments: `/api/v1/payments`
- Social: `/api/v1/social`
- Admin: `/api/v1/admin`
- Seller analytics: `/api/v1/seller`
- GraphQL: `/graphql`

## GraphQL quick start

The GraphQL endpoint supports product and store discovery plus current-user lookup.

Available GraphQL queries:

- `me`
- `product(productId)`
- `products(q, categoryId, brand, minPrice, maxPrice, sortBy, page, limit)`
- `newestProducts(limit)`
- `bestSellers(limit)`
- `mostViewed(limit)`
- `suggestedProducts(limit)`
- `store(storeId)`
- `stores(q, page, limit)`
- `storeProducts(storeId)`

Example query:

```graphql
query ProductsPage {
	products(page: 1, limit: 8, sortBy: NEWEST) {
		totalItems
		totalPages
		items {
			id
			name
			price
			soldQuantity
			viewCount
			imageUrls
		}
	}
}
```

Example authenticated query (send `Authorization: Bearer <access_token>`):

```graphql
query Me {
	me {
		id
		email
		fullName
		role
		rewardPoints
	}
}
```

Example GraphQL HTTP request:

```bash
curl -X POST http://127.0.0.1:8000/graphql \
	-H "Content-Type: application/json" \
	-d '{"query":"query { products(page:1, limit:4) { totalItems items { id name price } } }"}'
```

## Useful endpoints for frontend integration

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/products`
- `GET /api/v1/products/{product_id}`
- `GET /api/v1/stores`
- `GET /api/v1/stores/{store_id}`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/orders/history`
- `GET /api/v1/payments/{order_id}`
- `POST /api/v1/payments/{order_id}/initiate`

## Sample accounts from seed data

If you run `python seed.py`, these demo accounts are created:

- Admin: `admin@tmdt.local` / `Admin1234!`
- Buyer: `client@tmdt.local` / `Client1234!`
- Seller: `artist@tmdt.local` / `Artist1234!`

The seeded seller store is `Mina's Art Station`.

## Test command

Run the backend tests with:

```powershell
python -m pytest tests/test_sprint3.py tests/test_sprint4.py -q
```

Those tests currently pass in the workspace.

## Notes for the frontend dev

- The backend is already wired for marketplace flows, so the frontend can start against the documented `/api/v1` routes immediately.
- If you need a different local port, change the frontend dev server URL only; the backend CORS setting already allows local origins.
- If you add new API fields or flows on the frontend, keep the request payloads aligned with the Pydantic schemas in `app/schemas/`.