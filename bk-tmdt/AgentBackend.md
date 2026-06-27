# AI AGENT MASTER INSTRUCTION: COMPREHENSIVE E-COMMERCE MARKETPLACE (BACKEND)

## 1. PROJECT OVERVIEW & ROLE DEFINITION
**Role**: You are a Senior Backend Developer and Software Architect. Your task is to build a robust, scalable multi-vendor e-commerce marketplace.
**Goal**: Implement all specified mandatory and optional features using the exact tech stack provided. The system must be production-ready, following Clean Architecture principles, RESTful API standards, and strict database normalization.

### 1.1. Tech Stack Requirements
* **Backend**: Python 3.11+, FastAPI (Web framework), SQLAlchemy 2.0 (ORM), Alembic (Migrations), Pydantic V2 (Validation/Serialization), Passlib (Password Hashing), PyJWT (Authentication).
* **Database**: PostgreSQL 15+.
* **Other Tools**: Redis (optional, for caching/session/OTP), Docker (containerization).

---

## 2. SYSTEM ARCHITECTURE & DIRECTORY STRUCTURE
The project must be strictly divided into `frontend` and `backend` repositories to allow independent deployment.

### 2.1. Backend Directory Structure (FastAPI)
Must follow a modular, domain-driven design structure:

```text
backend/
├── app/
│   ├── main.py                 # FastAPI application instance & CORS setup
│   ├── core/                   # App-wide settings, security, config
│   │   ├── config.py           # Pydantic BaseSettings (DB_URL, JWT_SECRET, etc.)
│   │   ├── security.py         # JWT hashing/verification logic
│   │   └── exceptions.py       # Custom global exception handlers
│   ├── api/                    # API Routers grouped by domain
│   │   ├── dependencies.py     # get_db, get_current_user, get_admin
│   │   ├── v1/
│   │   │   ├── auth.py         # Registration, Login (Local, Google, FB), Logout
│   │   │   ├── users.py        # Profile updates, Point management
│   │   │   ├── stores.py       # Store search, Seller features
│   │   │   ├── products.py     # CRUD, Search, Filter, Sort, Home feed
│   │   │   ├── cart.py         # Cart management (auto-calc)
│   │   │   ├── orders.py       # Checkout, History, Status updates
│   │   │   ├── payments.py     # Payment gateway integration
│   │   │   ├── reviews.py      # Reviews and Comments
│   │   │   └── reports.py      # Violation reporting
│   ├── models/                 # SQLAlchemy ORM Models (Table definitions)
│   ├── schemas/                # Pydantic Models (Req/Res validation)
│   ├── crud/                   # Database operations (Create, Read, Update, Delete)
│   ├── services/               # Complex business logic (e.g., Stats, Points calc)
│   └── utils/                  # Helpers (Email sender, formatters)
├── alembic/                    # Database migrations
├── tests/                      # Pytest unit & integration tests
├── requirements.txt            # Python dependencies
└── .env                        # Environment variables
```

---

## 3. RELATIONAL DATABASE SCHEMA (POSTGRESQL)
The database must be highly normalized (3NF) to support the required features. Ensure proper indexing for foreign keys and frequently searched columns (e.g., `name`, `category`). 

**Constraint Warning**: All soft deletes should use an `is_active` boolean or `deleted_at` timestamp rather than hard deletion to preserve order history and analytics.

### 3.1. ENUM Types
* `RoleEnum`: `ADMIN`, `SELLER`, `BUYER`
* `AuthProviderEnum`: `LOCAL`, `GOOGLE`, `FACEBOOK`
* `OrderStatusEnum`: `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`
* `PaymentMethodEnum`: `COD`, `CREDIT_CARD`, `PAYPAL`
* `PaymentStatusEnum`: `UNPAID`, `PAID`, `REFUNDED`, `FAILED`
* `ReportTypeEnum`: `STORE_VIOLATION`, `CUSTOMER_VIOLATION`, `PRODUCT_VIOLATION`
* `ReportStatusEnum`: `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`

### 3.2. Core Entities (SQLAlchemy Models)

**1. `users` Table**
* `id`: UUID (Primary Key)
* `email`: String(255) (Unique, Indexed, Not Null)
* `password_hash`: String(255) (Nullable for OAuth users)
* `auth_provider`: AuthProviderEnum (Default: LOCAL)
* `provider_id`: String(255) (Nullable, for Google/FB ID)
* `role`: RoleEnum (Default: BUYER)
* `full_name`: String(255)
* `avatar_url`: Text (Nullable)
* `phone`: String(20) (Nullable)
* `address`: Text (Nullable)
* `reward_points`: Integer (Default: 0) - *For optional feature: Point accumulation*
* `is_active`: Boolean (Default: True)
* `is_verified`: Boolean (Default: False) - *For mandatory feature: Email verification*
* `created_at`, `updated_at`: Timestamps

**2. `stores` Table (For Seller Role)**
* `id`: UUID (Primary Key)
* `owner_id`: UUID (Foreign Key -> `users.id`, Unique)
* `name`: String(255) (Unique, Indexed)
* `description`: Text (Nullable)
* `rating`: Numeric(3, 2) (Default: 0.0)
* `created_at`, `updated_at`: Timestamps

**3. `categories` Table**
* `id`: UUID (Primary Key)
* `name`: String(100) (Unique, Indexed)
* `parent_id`: UUID (Foreign Key -> `categories.id`, Nullable) - *For hierarchical categories*
* `description`: Text (Nullable)

**4. `products` Table**
* `id`: UUID (Primary Key)
* `store_id`: UUID (Foreign Key -> `stores.id`, Indexed)
* `category_id`: UUID (Foreign Key -> `categories.id`, Indexed)
* `name`: String(255) (Indexed)
* `description`: Text
* `price`: Numeric(10, 2) (Not Null)
* `stock_quantity`: Integer (Default: 0)
* `sold_quantity`: Integer (Default: 0) - *For sorting by best seller*
* `view_count`: Integer (Default: 0) - *For displaying most viewed*
* `brand`: String(100) (Nullable) - *For filtering*
* `image_urls`: JSONB (Array of URLs)
* `is_active`: Boolean (Default: True)
* `created_at`: Timestamp (Indexed) - *For displaying newest products*
* `updated_at`: Timestamp

**5. `shopping_cart` & `cart_items` Tables**
*Cart Table:*
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> `users.id`, Unique)

*Cart Items Table:*
* `id`: UUID (Primary Key)
* `cart_id`: UUID (Foreign Key -> `shopping_cart.id`)
* `product_id`: UUID (Foreign Key -> `products.id`)
* `quantity`: Integer (Default: 1)
* *Note: Total price calculation is dynamic on the API/Frontend side when quantities change.*

**6. `orders` & `order_items` Tables**
*Orders Table:*
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> `users.id`)
* `store_id`: UUID (Foreign Key -> `stores.id`) - *Split orders by store if multi-vendor*
* `total_amount`: Numeric(10, 2)
* `points_used`: Integer (Default: 0) - *For point redemption*
* `discount_amount`: Numeric(10, 2) (Default: 0.0)
* `final_amount`: Numeric(10, 2)
* `status`: OrderStatusEnum (Default: PENDING)
* `shipping_address`: Text
* `created_at`, `updated_at`: Timestamps

*Order Items Table:*
* `id`: UUID (Primary Key)
* `order_id`: UUID (Foreign Key -> `orders.id`)
* `product_id`: UUID (Foreign Key -> `products.id`)
* `unit_price`: Numeric(10, 2) (Snapshot of price at purchase time)
* `quantity`: Integer

**7. `payments` Table**
* `id`: UUID (Primary Key)
* `order_id`: UUID (Foreign Key -> `orders.id`)
* `method`: PaymentMethodEnum
* `status`: PaymentStatusEnum
* `transaction_id`: String(255) (Nullable, from payment gateway)
* `created_at`: Timestamp

**8. `reviews` Table (Product Rating & Review)**
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> `users.id`)
* `product_id`: UUID (Foreign Key -> `products.id`)
* `order_item_id`: UUID (Foreign Key -> `order_items.id`, Unique) - *Ensure only verified buyers can review*
* `rating`: Integer (1 to 5)
* `comment`: Text
* `created_at`: Timestamp

**9. `comments` Table (Product Q&A)**
* `id`: UUID (Primary Key)
* `user_id`: UUID (Foreign Key -> `users.id`)
* `product_id`: UUID (Foreign Key -> `products.id`)
* `parent_id`: UUID (Foreign Key -> `comments.id`, Nullable) - *For nested replies*
* `content`: Text
* `created_at`, `updated_at`: Timestamps

**10. `reports` Table**
* `id`: UUID (Primary Key)
* `reporter_id`: UUID (Foreign Key -> `users.id`)
* `reported_store_id`: UUID (Foreign Key -> `stores.id`, Nullable)
* `reported_user_id`: UUID (Foreign Key -> `users.id`, Nullable)
* `report_type`: ReportTypeEnum
* `reason`: Text
* `status`: ReportStatusEnum (Default: PENDING)
* `created_at`: Timestamp

## 4. API SPECIFICATIONS & STRICT BUSINESS LOGIC CONSTRAINTS
This section defines the core epics, API endpoints, and the strict business rules the AI Agent MUST follow when implementing the FastAPI backend. Use RESTful conventions. All protected routes must require a valid JWT via `Authorization: Bearer <token>`.

### Epic 1: Authentication & Authorization (Mandatory & Optional)
**Prefix:** `/api/v1/auth`

* `POST /register`: Accepts email, password, full_name. 
    * *Logic*: Hash password using Passlib (Bcrypt). Create user with `is_verified=False`. 
    * *Task*: Trigger a `BackgroundTasks` to send a verification email with a JWT verification token (Mandatory Feature).
* `GET /verify-email?token=...`: Decodes token and sets `is_verified=True`.
* `POST /login`: Accepts email, password. Returns `{ access_token, refresh_token, token_type: "bearer", user: {...} }`.
* `POST /google-login` & `POST /facebook-login` (Optional Features selected):
    * *Logic*: Accept OAuth access token from Frontend. Verify token with Google/FB API. If email exists, link account and return JWT. If not, auto-register user, set `is_verified=True`, and return JWT.
* `POST /forgot-password` & `POST /reset-password`: Standard email link workflow using signed JWTs.
* `POST /logout`: Blacklist the refresh token (use Redis if configured, or a DB table).

### Epic 2: User Profile & Reward Points (Optional Features)
**Prefix:** `/api/v1/users`

* `GET /me`: Returns current user info.
* `PUT /me`: Update profile (full_name, phone, address, avatar_url).
* *Reward Points Logic (Strict Rules)*:
    * Points are automatically accumulated upon order completion (`status == COMPLETED`). 
    * *Formula*: 1 point per 100,000 VND spent (or dynamic ratio in config).
    * Points can be redeemed during checkout. 1 point = 1,000 VND discount.

### Epic 3: Products, Search, and Homepage Feeds
**Prefix:** `/api/v1/products`

* **Public Read Endpoints (Home Feeds - Optional Features):**
    * `GET /newest`: Order by `created_at DESC`. Limit 10.
    * `GET /best-sellers`: Order by `sold_quantity DESC`. Limit 10.
    * `GET /most-viewed`: Order by `view_count DESC`. Limit 10.
    * `GET /suggested`: Naive implementation: Random products from categories the user has previously bought from (or random if guest).
* **Search, Filter & Sort (Optional Features):**
    * `GET /`: Master endpoint for product discovery.
    * *Query Params*: `q` (search by name/description using ILIKE), `category_id`, `brand`, `min_price`, `max_price`.
    * *Sort Params*: `sort_by=price_asc|price_desc|sold_desc|newest`.
    * *Pagination*: `page`, `limit` (must return total_pages and total_items).
* `GET /{id}`: View product details. 
    * *Trigger*: Background task to increment `view_count` by 1.
* **Seller CRUD (Protected: SELLER role):**
    * `POST /`, `PUT /{id}`, `DELETE /{id}`: Sellers can only modify products belonging to their `store_id`. Validate this strictly!

### Epic 4: Stores & Vendors
**Prefix:** `/api/v1/stores`

* `GET /`: Search stores by name.
* `GET /{id}`: View store details and rating.
* `GET /{id}/products`: View all products belonging to a specific store.
* `POST /`: A buyer can register to become a seller (creates store, updates user role to SELLER).

### Epic 5: Smart Shopping Cart (Dynamic Calculation)
**Prefix:** `/api/v1/cart`

* `GET /`: Fetch current user's cart and all items.
    * *Logic Constraint*: The response MUST dynamically calculate and return `total_price` based on current product prices. Do not store `total_price` in the DB for carts.
* `POST /items`: Add product to cart. If exists, increment quantity.
* `PUT /items/{product_id}`: Update quantity. (Frontend will call this dynamically, no "Update Cart" button needed as per requirements).
* `DELETE /items/{product_id}`: Remove item.

### Epic 6: Order Workflow & Checkout
**Prefix:** `/api/v1/orders`

* `POST /checkout`: (Mandatory & Optional Point Redemption)
    * *Payload*: `shipping_address`, `payment_method`, `use_points` (boolean/integer).
    * *Logic Workflow*:
        1.  Fetch user cart. Verify `stock_quantity` >= `cart.quantity` for all items.
        2.  Calculate `total_amount`.
        3.  If `use_points` > 0: Validate user has enough points. Deduct points. Calculate `discount_amount`. `final_amount = total_amount - discount_amount`.
        4.  Create `orders` record. Create `order_items` (snapshotting current `price` to `unit_price`).
        5.  Decrement `stock_quantity` in `products` table.
        6.  Clear user's cart.
* `GET /history`: View purchase history (Mandatory).
* `PUT /{id}/status`: (Seller / Admin / Buyer).
    * *State Machine constraints*:
        * BUYER can only CANCEL if status is `PENDING`.
        * SELLER can update `PENDING` -> `PROCESSING` -> `SHIPPED`.
        * SYSTEM/ADMIN updates `SHIPPED` -> `COMPLETED`.
* `POST /{id}/cancel`: Buyer cancels order (Optional Feature). Restores `stock_quantity` and refunds used points.

### Epic 7: Payment Gateway Integration
**Prefix:** `/api/v1/payments`

* *Mandatory Feature*: Online Payment.
* Implement a mock or test-mode integration (e.g., Stripe, PayPal, or VNPay for Vietnam context).
* Provide a webhook endpoint `POST /webhook` to securely receive payment status updates from the gateway and update `OrderStatus` to `PAID`.

### Epic 8: Social Interactions (Reviews, Q&A, Reports)
**Prefix:** `/api/v1/social`

* **Reviews (Product Rating):**
    * `POST /reviews`: Submit a review.
    * *Constraint*: Query `order_items` and `orders`. User MUST have a `COMPLETED` order containing the `product_id` to review it. One review per `order_item_id`.
    * *Trigger*: Recalculate average `rating` on `stores` table.
* **Comments (Q&A):**
    * `POST /products/{id}/comments`: Anyone can ask a question.
    * `POST /comments/{parent_id}/reply`: Reply to a comment (Seller or other users).
* **Reports:**
    * `POST /reports`: Report a store or customer for violations. Admin will review these.

### Epic 9: Admin & Seller Dashboards (Statistics & Management)
**Prefix:** `/api/v1/admin` & `/api/v1/seller`

* **Admin Management (Mandatory):**
    * `GET /users`, `PUT /users/{id}/block`: Manage users.
    * `GET /stores`, `PUT /stores/{id}/disable`: Manage stores.
    * `GET /reports`, `PUT /reports/{id}/resolve`: Manage violation reports.
* **Seller Analytics (Mandatory Chart Data):**
    * `GET /seller/stats/revenue-bar-chart`: 
        * *Params*: `start_date`, `end_date`, `interval` (daily, weekly, monthly).
        * *Returns*: JSON array suitable for a Bar Chart (e.g., `[{ date: "2024-01-01", revenue: 5000000 }, ...]`). Filter only `COMPLETED` orders.
    * `GET /seller/stats/revenue-pie-chart`:
        * *Params*: `month`, `year`.
        * *Returns*: Revenue grouped by `category_id`. JSON array suitable for a Pie Chart (e.g., `[{ category: "Electronics", revenue: 2000000, percentage: 40.5 }, ...]`).

## 5. PROJECT PURPOSE, TYPE & DOMAIN CONTEXT
*CRITICAL: Read this section carefully to understand the business domain. All generated UI text, placeholder data, and error messages MUST align with this context.*

### 5.1. Project Type
**Multi-Vendor E-Commerce & Social Marketplace for Digital Art and Intellectual Property (IP).** It bridges the gap between B2C (fans, small streamers) and B2B (indie game developers, VTuber agencies) clients who want to purchase custom digital assets or license existing artworks.

### 5.2. Core Purpose & Problem It Solves
The platform is designed to disrupt traditional freelance marketplaces (like Fiverr or Upwork) by solving three major industry pain points for digital artists:
1.  **Payment Security:** Resolving the issue of "ghosting" and unpaid revisions through a strict Checkout & Order workflow.
2.  **IP Protection & The AI Crisis:** Providing a safe haven for human artists against unauthorized AI scraping. The system deals with digital assets that require copyright licensing.
3.  **Frictionless Ordering:** Transforming a regular shopping cart into a "Commission" workflow. 

### 5.3. Domain Vocabulary & UI Terminology
When generating components, dummy data, or notifications, the AI Agent MUST use the following terminology:
* **Seller** -> Should often be represented in UI as `Artist`, `Creator`, or `Vendor`.
* **Buyer** -> `Client`, `Customer`, or `Fan`.
* **Product** -> `Digital Asset`, `Commission Service`, `Artwork`, `Live2D Model`, or `Emote`.
* **Store** -> `Portfolio`, `Art Station`, or `Creator Profile`.
* **Order** -> `Commission`, `Project`, or `Order`.
* **Category Examples (For Seed Data)** -> DO NOT use "Electronics" or "Clothing". USE: `VTuber Avatars`, `Twitch Emotes`, `Concept Art`, `Live2D Rigging`, `Commercial Illustrations`.

### 5.4. Expected AI Agent Behavior
By understanding this purpose, you (the AI Agent) will:
1.  Generate React components with an aesthetic suitable for a creative/artistic platform (modern, dark-mode friendly, visually focused).
2.  Write seed scripts for the PostgreSQL database that populate realistic digital art services.
3.  Structure the Cart and Checkout flow to make sense for digital goods (e.g., shipping address might be collected for invoicing or physical merch later, but the primary focus is digital delivery).

## 6. BACKEND EXECUTION PLAN & TASK BREAKDOWN
*CRITICAL DIRECTIVE: You are acting strictly as the BACKEND ENGINEER. A separate team is building the React Frontend. DO NOT generate any frontend code, HTML, or React components. Your sole output must be Python code, SQL/Alembic migrations, and API documentation.*

Please execute the development in the following Agile Sprints. Wait for my approval after completing each sprint before moving to the next.

### Sprint 1: Project Initialization, Database & Authentication
**Goal:** Set up the foundation, ORM, and secure access.
* **Task 1.1:** Initialize FastAPI project structure (as defined in Section 2.1). Create `requirements.txt` with all necessary dependencies (FastAPI, Uvicorn, SQLAlchemy, psycopg2-binary, passlib, python-jose, alembic, pydantic-settings).
* **Task 1.2:** Configure `core/config.py` using Pydantic `BaseSettings` for environment variables (DB_URL, JWT_SECRET, etc.).
* **Task 1.3:** Create SQLAlchemy Base setup and define ALL database models exactly as specified in Section 3.2.
* **Task 1.4:** Initialize Alembic (`alembic init alembic`) and generate the first initial migration script.
* **Task 1.5:** Implement JWT Security utilities (`core/security.py`) for hashing passwords and encoding/decoding JWTs.
* **Task 1.6:** Implement Authentication endpoints (`POST /register`, `POST /login`). Include a background task placeholder for the verification email.
* **Task 1.7:** Implement dependencies (`api/dependencies.py`): `get_db`, `get_current_user`, `get_current_seller`, `get_current_admin`.

### Sprint 2: Catalog Management & Store Profiles
**Goal:** Build the core digital asset catalog and vendor management.
* **Task 2.1:** Create Pydantic schemas and CRUD operations for `Categories` and `Stores`.
* **Task 2.2:** Implement API endpoints for Users to register as a Seller (creating a `stores` record and updating user role).
* **Task 2.3:** Create Pydantic schemas and CRUD operations for `Products`.
* **Task 2.4:** Implement Public Product Endpoints: Homepage feeds (`/newest`, `/best-sellers`, `/most-viewed`) and the advanced Search endpoint with ILIKE queries, category/brand filters, and sorting parameters.
* **Task 2.5:** Implement Seller-protected Product endpoints (POST, PUT, DELETE) ensuring a seller can only mutate their own `store_id` products.

### Sprint 3: The Transaction Engine (Cart, Orders & Points)
**Goal:** Implement the shopping logic strictly following the "Smart Cart" and "Point Redemption" rules.
* **Task 3.1:** Implement Cart APIs. **CRITICAL:** The `GET /cart` endpoint MUST dynamically calculate and return the `total_amount` by fetching current product prices. Do not save cart total to the DB.
* **Task 3.2:** Create Pydantic schemas for Checkout (`shipping_address`, `payment_method`, `use_points`).
* **Task 3.3:** Implement `POST /checkout` logic:
    * Verify stock availability.
    * Calculate subtotal dynamically.
    * If `use_points` is true, validate point balance, deduct points, and apply discount.
    * Create `orders` and `order_items` (snapshotting current `price`).
    * Clear the cart and decrement `products.stock_quantity`.
* **Task 3.4:** Implement Order management endpoints (`GET /orders/history`, `PUT /orders/{id}/status`). Enforce state machine rules (e.g., Buyer can only cancel if PENDING).
* **Task 3.5:** Implement the logic to award `reward_points` to the user when an order status changes to `COMPLETED`.

### Sprint 4: Social Features, Analytics & Seeding
**Goal:** Finalize interaction features and provide data for the frontend team.
* **Task 4.1:** Implement Review & Rating APIs. Restrict review creation to users with a `COMPLETED` order item for that specific product. Auto-update store ratings.
* **Task 4.2:** Implement Q&A Comments APIs with self-referential nested replies (`parent_id`).
* **Task 4.3:** Implement Admin APIs (`/admin/users`, `/admin/reports`).
* **Task 4.4:** Implement Seller Analytics APIs. Write SQLAlchemy group-by queries to return data formatted for charts:
    * `/seller/stats/revenue-bar-chart` (Grouped by date interval).
    * `/seller/stats/revenue-pie-chart` (Grouped by category).
* **Task 4.5:** Write a `seed.py` script. **CRITICAL:** Populate the database with realistic dummy data fitting the Digital Art domain (e.g., "VTuber Live2D Rigging", "Twitch Emotes Pack") to help the frontend team test their UI.

**Action Required:** Acknowledge these instructions. Once acknowledged, begin outputting code starting ONLY with **Sprint 1, Task 1.1, 1.2, and 1.3**.

