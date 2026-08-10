from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base
import enum


class ApiStatus(str, enum.Enum):
    healthy = "healthy"
    warning = "warning"
    slow = "slow"
    down = "down"


class HttpMethod(str, enum.Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


class ApiEndpoint(Base):
    __tablename__ = "api_endpoints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(500), nullable=False)
    method: Mapped[HttpMethod] = mapped_column(Enum(HttpMethod), default=HttpMethod.GET)
    version: Mapped[str] = mapped_column(String(20), default="v1.0.0")
    owner: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[ApiStatus] = mapped_column(Enum(ApiStatus), default=ApiStatus.healthy)
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)
    avg_response_ms: Mapped[float] = mapped_column(Float, default=0.0)
    uptime_pct: Mapped[float] = mapped_column(Float, default=100.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    metrics: Mapped[list["Metric"]] = relationship("Metric", back_populates="api", cascade="all, delete-orphan")
    anomalies: Mapped[list["Anomaly"]] = relationship("Anomaly", back_populates="api", cascade="all, delete-orphan")
