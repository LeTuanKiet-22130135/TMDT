from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter

from app.routes.tagging import router as tagging_router
from app.schema import schema

app = FastAPI(title="CACAO — AI Search & Recommendations")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[cacao] error: {exc}")
    return JSONResponse(status_code=500, content={"error": 500, "message": "Something went wrong"})


app.include_router(tagging_router, prefix="/api/v1", tags=["tagging"])
app.include_router(GraphQLRouter(schema), prefix="/graphql")


@app.get("/")
def health():
    return {"status": "ok", "service": "bk-cacao"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
