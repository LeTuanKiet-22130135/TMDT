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

You can use the provided client script (`.agents/skills/agent-graphql/scripts/client.py`) instead of manual `curl` commands. The script automatically reads the `AGENT_API_KEY` from the backend's `.env` file. You can also specify a custom host with the `--url` flag (defaults to `http://localhost:8000`).

### 1. Authentication (Login)
To get an access token, use the `login` action.
```bash
python .agents/skills/agent-graphql/scripts/client.py login \
  --email "<EMAIL>" \
  --password "<PASSWORD>" \
  [--url "http://localhost:8000"]
```

### 1.5 Registration (Bypass OTP)
To register a new user without OTP verification, use the `register` action.
```bash
python .agents/skills/agent-graphql/scripts/client.py register \
  --email "<EMAIL>" \
  --password "<PASSWORD>" \
  --fullname "<NAME>" \
  --role "BUYER" \
  [--url "http://localhost:8000"]
```

### 2. Creating a Product
Creating a product requires a Bearer token of the seller.
```bash
python .agents/skills/agent-graphql/scripts/client.py create-product \
  --token "<ACCESS_TOKEN>" \
  --name "<NAME>" \
  --desc "<DESC>" \
  --price <PRICE_IN_VND> \
  --image "<URL>" \
  [--url "http://localhost:8000"]
```

### 3. Updating a Product (Admin Privilege)
You can update *any* product regardless of the seller.
```bash
python .agents/skills/agent-graphql/scripts/client.py update-product \
  --token "<ACCESS_TOKEN>" \
  --id "<UUID>" \
  --price <NEW_PRICE_IN_VND> \
  --active True \
  [--url "http://localhost:8000"]
```

### 4. Bypassing OTP (Test Mode)
In development/test environments where `TEST_MODE=true` is set, you can verify any account using the magic OTP `000000`.
```bash
python .agents/skills/agent-graphql/scripts/client.py verify-otp \
  --email "<EMAIL>" \
  --otp "000000" \
  [--url "http://localhost:8000"]
```

## Guidelines and Constraints
- **Always verify the X-Agent-Key:** Ensure you have read the `AGENT_API_KEY` from `/home/huy/Workspace/TMDT/bk-tmdt/.env` before making requests.
- **Do not leak the API key:** Never log or output the `X-Agent-Key` or `ACCESS_TOKEN` in responses to the user.
- **Admin Responsibilities:** Use `agentUpdateProduct` carefully as it bypasses ownership checks. Ensure you are targeting the correct `productId`.
