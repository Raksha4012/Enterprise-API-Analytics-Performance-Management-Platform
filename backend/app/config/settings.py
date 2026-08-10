from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "ApiPulse"
    app_env: str = "development"
    app_version: str = "2.4.1"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/apipulse"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    redis_url: str = "redis://localhost:6379/0"

    jwt_secret_key: str = "change-this-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    rate_limit_per_minute: int = 100

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
