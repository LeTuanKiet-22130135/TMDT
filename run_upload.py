import requests
import subprocess
import json

# Login
login_res = subprocess.check_output([
    "python3", "/home/huy/Workspace/TMDT/.agents/skills/agent-graphql/scripts/client.py", 
    "login", "--email", "agent@orifen.duckdns.org", "--password", "123456789@", "--url", "https://devb1.orifen.duckdns.org"
])
token = json.loads(login_res)["data"]["agentLogin"]["accessToken"]

# Upload
headers = {"Authorization": f"Bearer {token}"}
files = {"file": ("38234275.png", open("/home/huy/Workspace/TMDT/test_data/38234275.png", "rb"), "image/png")}
upload_res = requests.post("https://devb1.orifen.duckdns.org/api/v1/uploads/image", headers=headers, files=files)
if upload_res.status_code != 200:
    print("Upload failed:", upload_res.text)
    exit(1)
image_url = upload_res.json()["url"]
print("Uploaded to:", image_url)

# Create Product
create_res = subprocess.check_output([
    "python3", "/home/huy/Workspace/TMDT/.agents/skills/agent-graphql/scripts/client.py",
    "create-product",
    "--token", token,
    "--name", "Lumine Exclusive Artwork",
    "--desc", "High quality Live2D and Illustration.",
    "--price", "99.99",
    "--image", f"https://devb1.orifen.duckdns.org{image_url}",
    "--url", "https://devb1.orifen.duckdns.org"
])
print("Create response:")
print(create_res.decode("utf-8"))
