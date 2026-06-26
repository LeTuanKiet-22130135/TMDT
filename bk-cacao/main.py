from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from strawberry.fastapi import GraphQLRouter

from app.database import engine
from app.models import ProductRedProfile, UserRedProfile
from app.routes.tagging import router as tagging_router
from app.schema import schema


@asynccontextmanager
async def lifespan(app: FastAPI):
    from sqlalchemy import text
    from app.models import EMBEDDING_DIM

    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()

    UserRedProfile.__table__.create(engine, checkfirst=True)
    ProductRedProfile.__table__.create(engine, checkfirst=True)

    # Idempotent schema migrations for tables that may already exist
    with engine.connect() as conn:
        conn.execute(text(
            f"ALTER TABLE product_red_profile "
            f"ADD COLUMN IF NOT EXISTS embedding vector({EMBEDDING_DIM})"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_product_red_profile_embedding_hnsw "
            "ON product_red_profile USING hnsw (embedding vector_cosine_ops)"
        ))
        conn.commit()

    yield


app = FastAPI(title="CACAO — AI Search & Recommendations", lifespan=lifespan)

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
