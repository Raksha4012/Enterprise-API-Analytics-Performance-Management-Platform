from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
import structlog

log = structlog.get_logger()


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [{"field": ".".join(str(l) for l in e["loc"]), "msg": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": "Validation error", "errors": errors})


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    log.warning("database_integrity_error", path=request.url.path, error=str(exc.orig))
    return JSONResponse(status_code=409, content={"detail": "Resource already exists or constraint violated"})


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.error("unhandled_exception", path=request.url.path, error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
