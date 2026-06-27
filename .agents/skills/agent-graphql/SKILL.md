---
name: agent-graphql
description: Guide and tools for interacting with the dedicated Agent GraphQL API (/agent/graphql) to authenticate, create products, and update products with admin privileges.
---

# Agent GraphQL API

## Overview
Dedicated GraphQL endpoint at `http://localhost:8000/agent/graphql`. Allows bypassing standard UI flows to manage products and users with admin-level privileges.

## API Details
- **Endpoint:** `http://localhost:8000/agent/graphql`
- **Security Headers:**
  - `X-Agent-Key`: Required for all requests. Read from `bk-tmdt/.env`.
  - `Authorization`: `Bearer <token>` — required for product operations.

## Client Script
`.agents/skills/agent-graphql/scripts/client.py` — auto-reads `AGENT_API_KEY` from `.env`.

---

### 1. Login
```bash
python .agents/skills/agent-graphql/scripts/client.py login \
  --email "<EMAIL>" --password "<PASSWORD>" \
  [--url "http://localhost:8000"]
```

### 1.5 Register (Bypass OTP)
```bash
python .agents/skills/agent-graphql/scripts/client.py register \
  --email "<EMAIL>" --password "<PASSWORD>" \
  --fullname "<NAME>" --role "BUYER"
```

### 2. Create Product
Supports **any number of thumbnails** via URLs or local file paths (auto-uploaded).

```bash
# Multiple URLs
python .agents/skills/agent-graphql/scripts/client.py create-product \
  --token "<TOKEN>" \
  --name "Tên sản phẩm" \
  --desc "Mô tả" \
  --price 150000 \
  --images "https://..." "https://..." "https://..."

# Local files (uploaded automatically)
python .agents/skills/agent-graphql/scripts/client.py create-product \
  --token "<TOKEN>" \
  --name "Tên sản phẩm" \
  --desc "Mô tả" \
  --price 150000 \
  --image-files /path/thumb1.jpg /path/thumb2.png /path/thumb3.webp

# Mix URLs + local files
python .agents/skills/agent-graphql/scripts/client.py create-product \
  --token "<TOKEN>" \
  --name "Tên sản phẩm" \
  --desc "Mô tả" \
  --price 150000 \
  --images "https://existing.com/img.jpg" \
  --image-files /path/extra.png \
  --tags "live2d" "illustration" \
  --license "commercial" \
  --software-tags "Live2D Cubism" \
  --format-tags "moc3" "zip" \
  --main-file "https://cdn/.../asset.zip"
```

**All `create-product` flags:**
| Flag | Type | Description |
|------|------|-------------|
| `--token` | string | Bearer token (required) |
| `--name` | string | Product name (required) |
| `--desc` | string | Description (required) |
| `--price` | float | Price in VND (required) |
| `--images` | URL... | One or more image URLs |
| `--image-files` | PATH... | Local image files to upload (jpg/png/webp/gif) |
| `--tags` | string... | User-defined tags |
| `--license` | string | License type (default: `personal`) |
| `--software-tags` | string... | e.g. `"Live2D Cubism"` |
| `--format-tags` | string... | e.g. `moc3 zip psd` |
| `--category-id` | UUID | Category UUID |
| `--main-file` | URL | Downloadable main file URL |

### 3. Update Product (Admin Privilege)
Can update any product regardless of owner.

```bash
python .agents/skills/agent-graphql/scripts/client.py update-product \
  --token "<TOKEN>" \
  --id "<UUID>" \
  [--price 200000] \
  [--active true] \
  [--images "https://..." "https://..."] \
  [--image-files /path/new.jpg] \
  [--tags "tag1" "tag2"]
```

### 4. Verify OTP (Test Mode)
When `TEST_MODE=true`, magic OTP `000000` works for any account.
```bash
python .agents/skills/agent-graphql/scripts/client.py verify-otp \
  --email "<EMAIL>" --otp "000000"
```

## Image Upload Notes
- `--image-files` uploads each file to `/api/v1/uploads/image` (requires token)
- Supports: `image/jpeg`, `image/png`, `image/webp`, `image/gif` — max 10 MB each
- Upload progress printed to stderr; does not appear in JSON output

## Guidelines
- **Read `AGENT_API_KEY` from** `/home/huy/Workspace/TMDT/bk-tmdt/.env` before requests.
- **Never log** the API key or access token in responses to the user.
- **`agentUpdateProduct` bypasses ownership** — verify `--id` before running.
