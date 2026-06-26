import urllib.request, json
q = """
query {
  suggestions(offset: 0, limit: 5) {
    id
    name
    price
    imageUrl
    tags
    licenseType
    softwareTags
    formatTags
    authorName
    authorAvatar
    authorShortlink
    createdAt
  }
}
"""
req = urllib.request.Request(
    'http://localhost:8001/graphql',
    data=json.dumps({"query": q}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
print(urllib.request.urlopen(req).read().decode('utf-8'))
