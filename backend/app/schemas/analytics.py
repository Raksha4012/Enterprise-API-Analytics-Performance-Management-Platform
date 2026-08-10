from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class TrafficPoint(BaseModel):
    timestamp: str
    requests: int
    errors: int
    p95_ms: float


class TrafficResponse(BaseModel):
    data: list[TrafficPoint]
    total_requests: int
    total_errors: int
    error_rate: float


class ResponseTimePoint(BaseModel):
    date: str
    avg_ms: float
    min_ms: float
    max_ms: float
    p95_ms: float
    p99_ms: float


class ResponseTimeResponse(BaseModel):
    data: list[ResponseTimePoint]
    overall_avg_ms: float
    sla_compliance_pct: float


class ErrorPoint(BaseModel):
    code: int
    label: str
    count: int
    percentage: float


class ErrorAnalyticsResponse(BaseModel):
    distribution: list[ErrorPoint]
    total_errors: int
    error_rate: float


class AnomalyResponse(BaseModel):
    id: int
    api_name: str
    detected_at: datetime
    anomaly_type: str
    severity: str
    description: Optional[str]
    resolved: bool

    class Config:
        from_attributes = True


class PredictionPoint(BaseModel):
    time: str
    actual: Optional[float]
    predicted: Optional[float]
    lower: Optional[float]
    upper: Optional[float]


class PredictionResponse(BaseModel):
    model: str
    accuracy: float
    data: list[PredictionPoint]
    next_hour_forecast: int
    confidence: float
