from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router
from . import db as db_module
import os

app = FastAPI(title="CrowdSolve AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to PostgreSQL for persistent embedding storage.
# Falls back to in-memory if the DB is unreachable.
_db_url = os.environ.get("AI_DATABASE_URL")
if _db_url:
    try:
        db_module.init_db(_db_url)
    except Exception:
        pass

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "CrowdSolve AI Service"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
