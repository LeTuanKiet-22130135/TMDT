---
name: agent-graphql
description: Guide and tools for interacting with the dedicated Agent GraphQL API (/agent/graphql) to authenticate, create products, and update products with admin privileges.
---

# Agent GraphQL API

## Overview
This skill provides instructions for the agent to interact with its dedicated GraphQL endpoint at `http://localhost:8000/agent/graphql`. This API allows the agent to bypass standard UI flows and directly manage products and users, with admin-level privileges for product updates.

## API Details
- **Endpoint:** `http://localhost:8000/agent/graphql`
- **Security Headers:**
  - `X-Agent-Key`: Required for all requests. Use the value from the `.env` file (e.g., `agent-dev-key-change-in-prod`).
  - `Authorization`: `Bearer <token>` (Required for operations needing user context, like creating or updating products).

## Execution Steps

### 1. Authentication (Login)
To get an access token, use the `agentLogin` mutation.
```bash
curl -X POST http://localhost:8000/agent/graphql \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: <AGENT_API_KEY>" \
  -d '{"query": "mutation { agentLogin(email: \"<EMAIL>\", password: \"<PASSWORD>\") { accessToken user { id email role } } }"}'
```

### 1.5 Registration (Bypass OTP)
To register a new user without OTP verification, use the `agentRegister` mutation.
```bash
curl -X POST http://localhost:8000/agent/graphql \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: <AGENT_API_KEY>" \
  -d '{"query": "mutation { agentRegister(email: \"<EMAIL>\", password: \"<PASSWORD>\", fullName: \"<NAME>\", role: \"BUYER\") { accessToken user { id email role isVerified } } }"}'
```

### 2. Creating a Product
Creating a product requires a Bearer token of the seller.
```bash
curl -X POST http://localhost:8000/agent/graphql \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: <AGENT_API_KEY>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"query": "mutation { agentCreateProduct(name: \"<NAME>\", description: \"<DESC>\", price: <PRICE>, imageUrls: [\"<URL>\"]) { id name price } }"}'
```

### 3. Updating a Product (Admin Privilege)
You can update *any* product regardless of the seller, but you still need a valid Bearer token for auditing/context.
```bash
curl -X POST http://localhost:8000/agent/graphql \
  -H "Content-Type: application/json" \
  -H "X-Agent-Key: <AGENT_API_KEY>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{"query": "mutation { agentUpdateProduct(productId: \"<UUID>\", price: <NEW_PRICE>, isActive: true) { id price isActive } }"}'
```

### 4. Bypassing OTP (Test Mode)
In development/test environments where `TEST_MODE=true` is set in `.env`, you can verify any account using the magic OTP `000000` via the main graphql endpoint or through the agent if applicable.
```bash
curl -X POST http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { verifyOtp(email: \"<EMAIL>\", otp: \"000000\") }"}'
```

## Guidelines and Constraints
- **Always verify the X-Agent-Key:** Ensure you have read the `AGENT_API_KEY` from `/home/huy/Workspace/TMDT/bk-tmdt/.env` before making requests.
- **Do not leak the API key:** Never log or output the `X-Agent-Key` or `ACCESS_TOKEN` in responses to the user.
- **Admin Responsibilities:** Use `agentUpdateProduct` carefully as it bypasses ownership checks. Ensure you are targeting the correct `productId`.
