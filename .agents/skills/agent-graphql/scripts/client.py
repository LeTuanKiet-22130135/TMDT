#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
from typing import Dict, Any

def get_env_var(filepath: str, key: str) -> str:
    if not os.path.exists(filepath):
        return ""
    with open(filepath, 'r') as f:
        for line in f:
            if line.startswith(f"{key}="):
                return line.strip().split('=', 1)[1]
    return ""

def execute_graphql(url: str, query: str, variables: Dict[str, Any] = None, headers: Dict[str, str] = None) -> Dict[str, Any]:
    req_headers = {
        'Content-Type': 'application/json',
    }
    if headers:
        req_headers.update(headers)
    
    data = json.dumps({
        'query': query,
        'variables': variables or {}
    }).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=req_headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read()
            return json.loads(res_data)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {error_body}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Agent GraphQL Client")
    parser.add_argument('action', choices=['login', 'register', 'create-product', 'update-product', 'verify-otp'])
    parser.add_argument('--email', help="Email for login/verify/register")
    parser.add_argument('--password', help="Password for login/register")
    parser.add_argument('--fullname', help="Full name for register")
    parser.add_argument('--role', help="Role for register (e.g. BUYER)")
    parser.add_argument('--otp', help="OTP for verify-otp", default="000000")
    parser.add_argument('--token', help="Bearer token for authenticated requests")
    parser.add_argument('--name', help="Product name")
    parser.add_argument('--desc', help="Product description")
    parser.add_argument('--price', type=float, help="Product price (VND)")
    parser.add_argument('--image', help="Product image URL")
    parser.add_argument('--id', help="Product ID to update")
    parser.add_argument('--active', type=bool, help="Set active status for product")
    parser.add_argument('--url', help="Base URL for the GraphQL API", default="http://localhost:8000")
    
    args = parser.parse_args()
    
    # Extract agent key from .env
    env_path = os.path.join(os.path.dirname(__file__), "../../../../../bk-tmdt/.env")
    agent_key = get_env_var(env_path, "AGENT_API_KEY")
    if not agent_key:
        # Fallback to absolute path if relative fails
        agent_key = get_env_var("/home/huy/Workspace/TMDT/bk-tmdt/.env", "AGENT_API_KEY")
    
    agent_url = f"{args.url.rstrip('/')}/agent/graphql"
    main_url = f"{args.url.rstrip('/')}/graphql"
    
    headers = {"X-Agent-Key": agent_key}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"
        
    if args.action == 'login':
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
        
    elif args.action == 'register':
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
            "role": args.role or "BUYER"
        }, headers)
        print(json.dumps(res, indent=2))
        
    elif args.action == 'verify-otp':
        query = """
        mutation($email: String!, $otp: String!) {
          verifyOtp(email: $email, otp: $otp)
        }
        """
        res = execute_graphql(main_url, query, {"email": args.email, "otp": args.otp})
        print(json.dumps(res, indent=2))
        
    elif args.action == 'create-product':
        query = """
        mutation($name: String!, $desc: String!, $price: Float!, $images: [String!]!) {
          agentCreateProduct(name: $name, description: $desc, price: $price, imageUrls: $images) {
            id name price
          }
        }
        """
        res = execute_graphql(agent_url, query, {
            "name": args.name,
            "desc": args.desc,
            "price": args.price,
            "images": [args.image] if args.image else []
        }, headers)
        print(json.dumps(res, indent=2))
        
    elif args.action == 'update-product':
        query = """
        mutation($id: UUID!, $price: Float, $isActive: Boolean) {
          agentUpdateProduct(productId: $id, price: $price, isActive: $isActive) {
            id price isActive
          }
        }
        """
        vars_dict = {"id": args.id}
        if args.price is not None: vars_dict["price"] = args.price
        if args.active is not None: vars_dict["isActive"] = args.active
            
        res = execute_graphql(agent_url, query, vars_dict, headers)
        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
