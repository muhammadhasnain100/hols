from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import health_router

app = FastAPI(
    title="House of Life Sciences API",
    description="Backend API for HOLS",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api", tags=["health"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to HOLS API", "docs": "/docs"}
