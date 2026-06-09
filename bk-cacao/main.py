from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter
from app.schema import schema, get_context
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CACAO AGENT API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Server Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": 500, "message": "Something wrong"}
    )

graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
def read_root():
    return {"message": "Agent is running. Go to /graphql to use"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="[IP_ADDRESS]", port=8000, reload=True)