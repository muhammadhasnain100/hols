from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.exceptions import register_exception_handlers
from core.logging_config import setup_logging
from core.middleware import ApiResponseMiddleware, RequestLoggingMiddleware
from database import create_table_async
from routes import auth_router, health_router, lectures_router, payment_router, users_router
from services.routes.payment.service import ensure_default_plans

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(level=settings.log_level, log_format=settings.log_format)  # type: ignore[arg-type]
    logger.info("Starting HOLS API")
    await create_table_async()
    await ensure_default_plans()
    logger.info("Startup complete")
    yield
    logger.info("Shutting down HOLS API")


app = FastAPI(
    title="House of Life Sciences API",
    description="Backend API for HOLS",
    version="0.1.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(ApiResponseMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8012",
        "http://127.0.0.1:8012",
        "https://hols-ashen.vercel.app",
        "https://hols-frontend.avishkarai.com",
        "https://hols-backend.avishkarai.com",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(lectures_router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Welcome to HOLS API", "docs": "/docs"}
