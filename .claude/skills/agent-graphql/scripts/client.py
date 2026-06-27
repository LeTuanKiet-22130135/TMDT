#!/usr/bin/env python3
import argparse
import json
import mimetypes
import os
import sys
import urllib.request
import uuid
from typing import Any, Dict, List, Optional

ENV_PATH_DEFAULT = "/home/huy/Workspace/TMDT/bk-tmdt/.env"


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
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


def upload_file_to_endpoint(base_url: str, filepath: str, token: str, endpoint: str) -> str:
    """Upload a local file to given endpoint, return full server URL."""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    mime = mimetypes.guess_type(filepath)[0] or "application/octet-stream"
    boundary = uuid.uuid4().hex

    with open(filepath, "rb") as f:
        file_data = f.read()

    filename = os.path.basename(filepath)
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode() + file_data + f"\r\n--{boundary}--\r\n".encode()

    upload_url = f"{base_url.rstrip('/')}/api/v1/uploads/{endpoint}"
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Authorization": f"Bearer {token}",
    }
    req = urllib.request.Request(upload_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())
            # Prepend base_url so stored URL is absolute (frontend needs full http://host/...)
            relative = result["url"]
            return f"{base_url.rstrip('/')}{relative}"
    except urllib.error.HTTPError as e:
        print(f"Upload failed {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Upload error: {e}", file=sys.stderr)
        sys.exit(1)


def upload_image_file(base_url: str, filepath: str, token: str) -> str:
    return upload_file_to_endpoint(base_url, filepath, token, "image")


def resolve_images(base_url: str, image_urls: List[str], image_files: List[str], token: Optional[str]) -> List[str]:
    """Merge URL list + upload local files, return combined URL list."""
    urls = list(image_urls or [])
    for filepath in (image_files or []):
        if not token:
            print("--token required when uploading image files", file=sys.stderr)
            sys.exit(1)
        url = upload_image_file(base_url, filepath, token)
        print(f"  uploaded: {filepath} → {url}", file=sys.stderr)
        urls.append(url)
    return urls


def main():
    parser = argparse.ArgumentParser(description="Agent GraphQL Client")
    parser.add_argument("action", choices=["login", "register", "create-product", "update-product", "verify-otp"])
    parser.add_argument("--email")
    parser.add_argument("--password")
    parser.add_argument("--fullname")
    parser.add_argument("--role", default="BUYER")
    parser.add_argument("--otp", default="000000")
    parser.add_argument("--token", help="Bearer token")
    parser.add_argument("--name", help="Product name")
    parser.add_argument("--desc", help="Product description")
    parser.add_argument("--price", type=float)
    # Image input — URLs or local files (any number)
    parser.add_argument("--images", nargs="+", metavar="URL", default=[], help="Image URL(s)")
    parser.add_argument("--image-files", nargs="+", metavar="PATH", default=[], help="Local image file(s) to upload")
    # Legacy single --image flag kept for compat
    parser.add_argument("--image", help="Single image URL (alias for --images)")
    # Optional product fields
    parser.add_argument("--tags", nargs="+", metavar="TAG", default=[], help="User tags")
    parser.add_argument("--license", default="personal", help="License type (default: personal)")
    parser.add_argument("--software-tags", nargs="+", metavar="TAG", default=[])
    parser.add_argument("--format-tags", nargs="+", metavar="TAG", default=[])
    parser.add_argument("--category-id", help="Category UUID")
    parser.add_argument("--main-file", help="Main downloadable file URL (already hosted)")
    parser.add_argument("--main-file-upload", metavar="PATH", help="Local file to upload as main downloadable asset")
    # Update fields
    parser.add_argument("--id", help="Product UUID to update")
    parser.add_argument("--active", type=lambda x: x.lower() == "true", help="true/false")
    parser.add_argument("--url", default="http://localhost:8000", help="Base API URL")

    args = parser.parse_args()

    env_path = os.path.join(os.path.dirname(__file__), "../../../../../bk-tmdt/.env")
    agent_key = get_env_var(env_path, "AGENT_API_KEY") or get_env_var(ENV_PATH_DEFAULT, "AGENT_API_KEY")

    agent_url = f"{args.url.rstrip('/')}/agent/graphql"
    main_url = f"{args.url.rstrip('/')}/graphql"

    headers = {"X-Agent-Key": agent_key}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"

    if args.action == "login":
        query = """
        mutation($email: String!, $password: String!) {
          agentLogin(email: $email, password: $password) {
            accessToken
            user { id email role }
          }
        }
        """
        res = execute_graphql(agent_url, query, {"email": args.email, "password": args.password}, headers)
        print(json.dumps(res, indent=2))

    elif args.action == "register":
        query = """
        mutation($email: String!, $password: String!, $fullName: String!, $role: String!) {
          agentRegister(email: $email, password: $password, fullName: $fullName, role: $role) {
            accessToken
            user { id email role isVerified }
          }
        }
        """
        res = execute_graphql(agent_url, query, {
            "email": args.email,
            "password": args.password,
            "fullName": args.fullname or "Test User",
            "role": args.role,
        }, headers)
        print(json.dumps(res, indent=2))

    elif args.action == "verify-otp":
        query = """
        mutation($email: String!, $otp: String!) {
          verifyOtp(email: $email, otp: $otp)
        }
        """
        res = execute_graphql(main_url, query, {"email": args.email, "otp": args.otp})
        print(json.dumps(res, indent=2))

    elif args.action == "create-product":
        # Collect images from all sources
        image_urls = list(args.images)
        if args.image:
            image_urls.insert(0, args.image)
        image_urls = resolve_images(args.url, image_urls, args.image_files, args.token)

        if not image_urls:
            print("Warning: no images provided", file=sys.stderr)

        # Resolve main file
        main_file_url = args.main_file
        if args.main_file_upload:
            if not args.token:
                print("--token required when uploading main file", file=sys.stderr)
                sys.exit(1)
            main_file_url = upload_file_to_endpoint(args.url, args.main_file_upload, args.token, "file")
            print(f"  uploaded main file: {args.main_file_upload} → {main_file_url}", file=sys.stderr)

        query = """
        mutation(
          $name: String!
          $desc: String!
          $price: Float!
          $images: [String!]!
          $tags: [String!]
          $license: String
          $softwareTags: [String!]
          $formatTags: [String!]
          $categoryId: UUID
          $mainFile: String
        ) {
          agentCreateProduct(
            name: $name
            description: $desc
            price: $price
            imageUrls: $images
            userTags: $tags
            licenseType: $license
            softwareTags: $softwareTags
            formatTags: $formatTags
            categoryId: $categoryId
            mainFileUrl: $mainFile
          ) {
            id name price imageUrls licenseType userTags
          }
        }
        """
        variables: Dict[str, Any] = {
            "name": args.name,
            "desc": args.desc,
            "price": args.price,
            "images": image_urls,
            "tags": args.tags or None,
            "license": args.license,
            "softwareTags": args.software_tags or None,
            "formatTags": args.format_tags or None,
            "categoryId": args.category_id or None,
            "mainFile": main_file_url or None,
        }
        res = execute_graphql(agent_url, query, variables, headers)
        print(json.dumps(res, indent=2))

    elif args.action == "update-product":
        query = """
        mutation($id: UUID!, $price: Float, $isActive: Boolean, $images: [String!], $tags: [String!], $mainFile: String) {
          agentUpdateProduct(
            productId: $id
            price: $price
            isActive: $isActive
            imageUrls: $images
            userTags: $tags
            mainFileUrl: $mainFile
          ) {
            id price isActive imageUrls mainFileUrl
          }
        }
        """
        image_urls = list(args.images)
        if args.image:
            image_urls.insert(0, args.image)
        image_urls = resolve_images(args.url, image_urls, args.image_files, args.token)

        main_file_url = args.main_file
        if args.main_file_upload:
            if not args.token:
                print("--token required when uploading main file", file=sys.stderr)
                sys.exit(1)
            main_file_url = upload_file_to_endpoint(args.url, args.main_file_upload, args.token, "file")
            print(f"  uploaded main file: {args.main_file_upload} → {main_file_url}", file=sys.stderr)

        variables = {"id": args.id}
        if args.price is not None:
            variables["price"] = args.price
        if args.active is not None:
            variables["isActive"] = args.active
        if image_urls:
            variables["images"] = image_urls
        if args.tags:
            variables["tags"] = args.tags
        if main_file_url:
            variables["mainFile"] = main_file_url

        res = execute_graphql(agent_url, query, variables, headers)
        print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
