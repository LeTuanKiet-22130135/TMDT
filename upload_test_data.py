import json
import mimetypes
import os
import random
import urllib.request
import uuid
from typing import Any, Dict, List, Optional

# --- Configuration ---
BASE_URL = "http://localhost:8000"  # Default, will be overridden by agent_account.txt
TEST_DATA_DIR = "test_data"
UPLOADED_LOG_FILE = os.path.join(TEST_DATA_DIR, "uploaded_files.json")
AGENT_ACCOUNT_FILE = os.path.join(TEST_DATA_DIR, "agent_account.txt")
BOTS_FILE = os.path.join(TEST_DATA_DIR, "bot.txt")

# Random data for products
PRODUCT_NAMES = [
    "Lumine Digital Asset A",
    "Sora's Dream Illustration",
    "Kawaii Live2D Model",
    "Neon City Concept Art",
    "Sakura Petals Pack",
    "Cyberpunk Avatar Kit",
    "Mystic Forest Background",
    "Anime Character Sheet",
    "Fantasy Weapon Set",
    "Celestial Star Map",
    "Ancient Rune Glyphs",
    "Ocean Breeze Layout",
    "Sunset Horizon Painting",
    "Midnight Shadow Concept",
    "Emerald Dragon Scale",
]
PRODUCT_DESCRIPTIONS = [
    "High-quality digital asset for your creative projects.",
    "Beautifully crafted illustration with rich details.",
    "Professional Live2D model ready for streaming.",
    "Vibrant neon colors capturing the essence of a futuristic city.",
    "A delicate collection of sakura petals for nature-themed art.",
    "Complete avatar kit with multiple expressions and outfits.",
    "Immersive forest background perfect for RPGs.",
    "Detailed character sheet for anime-style productions.",
    "Set of unique fantasy weapons with magical effects.",
    "An intricate map of the celestial stars.",
    "Ancient runes for mystical world-building.",
    "Clean and refreshing ocean breeze layout.",
    "Stunning sunset horizon painting.",
    "Dark and moody midnight shadow concept art.",
    "Detailed emerald dragon scales for creature design.",
]

# --- Helpers ---


def get_env_var(filepath: str, key: str) -> str:
    if not os.path.exists(filepath):
        return ""
    with open(filepath) as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line.strip().split("=", 1)[1]
    return ""


def execute_graphql(
    url: str,
    query: str,
    variables: Dict[str, Any] = None,
    headers: Dict[str, str] = None,
) -> Dict[str, Any]:
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    data = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(url, data=data, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"GraphQL Error: {e}")
        return {"errors": [str(e)]}


def upload_file(base_url: str, filepath: str, token: str, endpoint: str) -> str:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    mime = mimetypes.guess_type(filepath)[0] or "application/octet-stream"
    boundary = uuid.uuid4().hex

    with open(filepath, "rb") as f:
        file_data = f.read()

    filename = os.path.basename(filepath)
    body = (
        (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {mime}\r\n\r\n"
        ).encode()
        + file_data
        + f"\r\n--{boundary}--\r\n".encode()
    )

    upload_url = f"{base_url.rstrip('/')}/api/v1/uploads/{endpoint}"
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {token}",
    }
    req = urllib.request.Request(upload_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            relative = result["url"]
            return f"{base_url.rstrip('/')}{relative}"
    except Exception as e:
        print(f"Upload failed for {filepath}: {e}")
        raise e


def parse_agent_account():
    with open(AGENT_ACCOUNT_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    data = {}
    for line in lines:
        if ":" in line:
            key, val = line.split(":", 1)
            data[key.strip().lower()] = val.strip()

    # Fallback: read AGENT_API_KEY from bk-tmdt/.env
    agent_api_key = data.get("agent api key") or data.get("agent_api_key") or get_env_var("bk-tmdt/.env", "AGENT_API_KEY") or "agent-dev-key-change-in-prod"

    return {
        "email": data.get("email"),
        "password": data.get("password"),
        "url": data.get("url", BASE_URL),
        "agent_api_key": agent_api_key,
    }


def parse_bots():
    bots = []
    if not os.path.exists(BOTS_FILE):
        return bots

    with open(BOTS_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by && \ or just newlines
    commands = content.replace(" && \\", "\n").split("\n")
    for cmd in commands:
        if "register" in cmd:
            email = ""
            password = ""
            # Crude extraction of --email "..." and --password "..."
            import re

            email_match = re.search(r'--email\s+"([^"]+)"', cmd)
            pass_match = re.search(r'--password\s+"([^"]+)"', cmd)
            if email_match and pass_match:
                bots.append(
                    {"email": email_match.group(1), "password": pass_match.group(1)}
                )

    return bots


def main():
    # 1. Setup
    print("--- Starting Test Data Upload ---")
    main_acc = parse_agent_account()
    bots = parse_bots()

    # Load upload log
    uploaded_files = {}
    if os.path.exists(UPLOADED_LOG_FILE):
        with open(UPLOADED_LOG_FILE, "r") as f:
            uploaded_files = json.load(f)

    # Gather images
    all_images = [
        os.path.join(TEST_DATA_DIR, f)
        for f in os.listdir(TEST_DATA_DIR)
        if f.endswith(".png")
    ]
    random.shuffle(all_images)
    print(f"Found {len(all_images)} images to process.")

    agent_api_key = main_acc["agent_api_key"]
    agent_headers = {"X-Agent-Key": agent_api_key}

    # Accounts to process: Main Account + Bots
    accounts = [
        {
            "email": main_acc["email"],
            "password": main_acc["password"],
            "url": main_acc["url"],
            "name": "Main Agent",
        }
    ]
    for bot in bots:
        accounts.append(
            {
                "email": bot["email"],
                "password": bot["password"],
                "url": main_acc["url"],
                "name": "Bot Account",
            }
        )

    # Distribute images among accounts
    chunk_size = (len(all_images) + len(accounts) - 1) // len(accounts)

    for i, acc in enumerate(accounts):
        print(f"\nProcessing account: {acc['name']} ({acc['email']})")

        # Login
        agent_url = f"{acc['url'].rstrip('/')}/agent/graphql"
        login_query = """
        mutation($email: String!, $password: String!) {
          agentLogin(email: $email, password: $password) {
            accessToken
          }
        }
        """
        login_res = execute_graphql(
            agent_url, login_query, {"email": acc["email"], "password": acc["password"]}, agent_headers
        )
        token = login_res.get("data", {}).get("agentLogin", {}).get("accessToken")

        if not token:
            print(f"  Failed to login for {acc['email']}. Skipping...")
            continue

        print(f"  Logged in successfully.")

        # Assign images to this account
        my_images = all_images[i * chunk_size : (i + 1) * chunk_size]

        for img_path in my_images:
            try:
                # Ensure file is uploaded (deduplication)
                if img_path not in uploaded_files:
                    print(f"  Uploading new file: {img_path}...")
                    url = upload_file(acc["url"], img_path, token, "image")
                    uploaded_files[img_path] = url
                else:
                    url = uploaded_files[img_path]

                # Create product
                name = random.choice(PRODUCT_NAMES) + f" #{random.randint(100, 999)}"
                desc = random.choice(PRODUCT_DESCRIPTIONS)
                price = round(random.uniform(10.0, 500.0), 2)
                tags = ["test", "bot-data", "automation"]

                create_query = """
                mutation($name: String!, $desc: String!, $price: Float!, $images: [String!]!, $tags: [String!]) {
                  agentCreateProduct(
                    name: $name
                    description: $desc
                    price: $price
                    imageUrls: $images
                    userTags: $tags
                  ) {
                    id name
                  }
                }
                """
                vars = {
                    "name": name,
                    "desc": desc,
                    "price": price,
                    "images": [url],
                    "tags": tags,
                }
                prod_res = execute_graphql(
                    agent_url, create_query, vars, {**agent_headers, "Authorization": f"Bearer {token}"}
                )

                if "errors" in prod_res:
                    print(
                        f"  Error creating product for {img_path}: {prod_res['errors']}"
                    )
                else:
                    prod_id = (
                        prod_res.get("data", {}).get("agentCreateProduct", {}).get("id")
                    )
                    print(f"  Created product {prod_id}: {name} (Price: {price})")

            except Exception as e:
                print(f"  Unexpected error processing {img_path}: {e}")

    # Save upload log
    with open(UPLOADED_LOG_FILE, "w") as f:
        json.dump(uploaded_files, f, indent=2)

    print("\n--- Upload Process Completed ---")


if __name__ == "__main__":
    main()
