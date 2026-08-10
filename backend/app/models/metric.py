from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.connection import Base


class Metric(Base):
    __tablename__ = "metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    api_id: Mapped[int] = mapped_column(Integer, ForeignKey("api_endpoints.id"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    requests: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_ms: Mapped[float] = mapped_column(Float, default=0.0)
    p95_response_ms: Mapped[float] = mapped_column(Float, default=0.0)
    p99_response_ms: Mapped[float] = mapped_column(Float, default=0.0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)

    api: Mapped["ApiEndpoint"] = relationship("ApiEndpoint", back_populates="metrics")


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    api_id: Mapped[int] = mapped_column(Integer, ForeignKey("api_endpoints.id"), nullable=False, index=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    anomaly_type: Mapped[str] = mapped_column(String(80), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="warning")
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    resolved: Mapped[bool] = mapped_column(default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    api: Mapped["ApiEndpoint"] = relationship("ApiEndpoint", back_populates="anomalies")
