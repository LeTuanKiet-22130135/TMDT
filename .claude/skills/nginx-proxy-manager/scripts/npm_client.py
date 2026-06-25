#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import argparse
import os
import sys

BASE_URL = "http://homeserver:1081/api"
TOKEN_FILE = "/tmp/.npm_token"

def request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Error {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)

def get_token():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return f.read().strip()
    return None

def save_token(token):
    with open(TOKEN_FILE, 'w') as f:
        f.write(token)

def set_token(token):
    save_token(token)
    print("Token saved successfully.")

def login(email, password):
    res = request("/tokens", "POST", {"identity": email, "secret": password})
    token = res.get("token")
    if token:
        save_token(token)
        print("Logged in successfully.")
    else:
        print("Login failed.", file=sys.stderr)
        sys.exit(1)

def get_certs():
    token = get_token()
    if not token:
        print("Not logged in.", file=sys.stderr)
        sys.exit(1)
    certs = request("/nginx/certificates", "GET", token=token)
    print(json.dumps(certs, indent=2))
    return certs

def create_proxy(domains, forward_host, forward_port, scheme, cert_id, enable_ssl, le_email):
    token = get_token()
    if not token:
        print("Not logged in.", file=sys.stderr)
        sys.exit(1)
        
    if enable_ssl and not cert_id:
        cert_id = "new"
        
    data = {
        "domain_names": [d.strip() for d in domains.split(",")],
        "forward_scheme": scheme,
        "forward_host": forward_host,
        "forward_port": int(forward_port),
        "access_list_id": "0",
        "certificate_id": cert_id if cert_id else "0",
        "meta": {
            "letsencrypt_email": le_email if le_email else "",
            "letsencrypt_agree": True if cert_id == "new" else False
        },
        "advanced_config": "",
        "locations": [],
        "block_exploits": False,
        "caching_enabled": False,
        "allow_websocket_upgrade": True,
        "http2_support": False,
        "hsts_enabled": False,
        "hsts_subdomains": False,
        "ssl_forced": bool(cert_id and cert_id != "0")
    }
    
    res = request("/nginx/proxy-hosts", "POST", data, token=token)
    print("Proxy host created:", json.dumps(res, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nginx Proxy Manager CLI")
    subparsers = parser.add_subparsers(dest="action")
    
    # Login
    p_login = subparsers.add_parser("login")
    p_login.add_argument("email")
    p_login.add_argument("password")
    
    # Set Token
    p_set_token = subparsers.add_parser("set-token")
    p_set_token.add_argument("token", help="Manually set JWT token")
    
    # List certs
    p_certs = subparsers.add_parser("certs")
    
    # Create proxy
    p_proxy = subparsers.add_parser("create-proxy")
    p_proxy.add_argument("--domains", required=True, help="Comma separated domains")
    p_proxy.add_argument("--host", required=True, help="Forward host")
    p_proxy.add_argument("--port", required=True, type=int, help="Forward port")
    p_proxy.add_argument("--scheme", default="http", help="Forward scheme (http/https)")
    p_proxy.add_argument("--cert-id", help="Certificate ID (use 'new' for new LE cert)")
    p_proxy.add_argument("--enable-ssl", action="store_true", help="Enable SSL (implies cert-id=new if not provided)")
    p_proxy.add_argument("--le-email", help="Email for Let's Encrypt (required if creating new cert)")

    args = parser.parse_args()
    
    if args.action == "login":
        login(args.email, args.password)
    elif args.action == "set-token":
        set_token(args.token)
    elif args.action == "certs":
        get_certs()
    elif args.action == "create-proxy":
        create_proxy(args.domains, args.host, args.port, args.scheme, args.cert_id, args.enable_ssl, args.le_email)
    else:
        parser.print_help()
