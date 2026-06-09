from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_graphql_hello():
    query = """
    query {
        hello
    }
    """
    response = client.post("/graphql", json={"query": query})
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["hello"] == "Hello World"

def test_global_exception():
    @app.get("/force-error")
    def force_error():
        raise Exception("Mock error")
        
    response = client.get("/force-error")
    assert response.status_code == 500
    data = response.json()
    assert "error" in data
    assert data["error"] == 500
    assert "message" in data
    assert data["message"] == "Something wrong"
