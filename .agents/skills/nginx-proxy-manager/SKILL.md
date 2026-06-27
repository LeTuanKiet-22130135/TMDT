---
name: nginx-proxy-manager
description: CLI tool for interacting with Nginx Proxy Manager at http://homeserver:1081 via REST API.
---

# Nginx Proxy Manager Skill

## Overview
This skill provides a way to interact with Nginx Proxy Manager (NPM) using its REST API. It uses a Python script located at `scripts/npm_client.py` to authenticate, list certificates, and create proxy hosts.

## Execution Steps
To use this skill, run the Python script `/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py` using the `run_command` tool with the appropriate arguments.

### 1. Authentication
You can authenticate either by logging in with credentials or by manually setting a JWT token provided by the user.

**Set Token (Preferred):**
When the user provides a token, use this command to save it:
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py set-token <token>
```

**Login:**
Alternatively, if you have email and password, you can login:
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py login <email> <password>
```

### 2. List Certificates
To get a list of existing SSL certificates:
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py certs
```

### 3. Create Proxy Host
To create a new proxy host without SSL:
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py create-proxy --domains example.com --host 192.168.1.10 --port 80
```

To create a new proxy host with an existing SSL certificate (use the certificate ID from `certs` output):
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py create-proxy --domains example.com --host 192.168.1.10 --port 80 --cert-id 1
```

To create a new proxy host and automatically request a new Let's Encrypt SSL certificate:
```bash
/home/huy/Workspace/TMDT/.agents/skills/nginx-proxy-manager/scripts/npm_client.py create-proxy --domains example.com --host 192.168.1.10 --port 80 --enable-ssl --le-email your@email.com
```

## Notes
- The script automatically handles the HTTP schema (default is `http`). If you need to forward to an HTTPS backend, add `--scheme https`.
- The token is saved in `/tmp/.npm_token` and is reused for subsequent commands.
