import subprocess
import json

# Login
login_res = subprocess.check_output([
    "python3", "/home/huy/Workspace/TMDT/.agents/skills/agent-graphql/scripts/client.py", 
    "login", "--email", "agent@orifen.duckdns.org", "--password", "123456789@", "--url", "https://devb1.orifen.duckdns.org"
])
token = json.loads(login_res)["data"]["agentLogin"]["accessToken"]

# Update Product
update_res = subprocess.check_output([
    "python3", "/home/huy/Workspace/TMDT/.agents/skills/agent-graphql/scripts/client.py",
    "update-product",
    "--token", token,
    "--id", "fb5ff62b-d51c-483f-b5bf-1be5e5c09983",
    "--price", "2500000",
    "--url", "https://devb1.orifen.duckdns.org"
])
print("Update response:")
print(update_res.decode("utf-8"))
