from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from prometheus_fastapi_instrumentator import Instrumentator

from app.config.settings import get_settings
from app.database.connection import create_tables
from app.routers import auth, apis, analytics, users, reports, ml
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from app.exceptions.handlers import (
    validation_exception_handler,
    integrity_error_handler,
    unhandled_exception_handler,
)
from slowapi.errors import RateLimitExceeded
import structlog

settings = get_settings()
log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", app=settings.app_name, version=settings.app_version, env=settings.app_env)
    await create_tables()
    yield
    log.info("shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Enterprise API Analytics & Performance Management Platform — REST API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(apis.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(users.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(ml.router, prefix=API_PREFIX)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "version": settings.app_version, "env": settings.app_env}


@app.get("/", tags=["Root"])
async def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
