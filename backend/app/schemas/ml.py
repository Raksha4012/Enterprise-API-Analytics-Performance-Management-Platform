"""ML prediction and anomaly detection schemas."""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional


class TrainRequest(BaseModel):
    api_id: Optional[int] = Field(None, description="Train on a specific API; None = all")
    lookback_hours: int = Field(168, ge=24, le=8760, description="Hours of history to use")


class TrainResponse(BaseModel):
    model: str
    api_id: Optional[int]
    samples_used: int
    r2_score: float = Field(description="R² on hold-out test set")
    mae: float = Field(description="Mean Absolute Error (requests)")
    trained_at: str


class ForecastPoint(BaseModel):
    time: str
    actual: Optional[float] = None
    predicted: Optional[float] = None
    lower: Optional[float] = None
    upper: Optional[float] = None


class ModelMeta(BaseModel):
    name: str
    r2: float
    mae: float
    rmse: float
    samples: int


class ForecastResponse(BaseModel):
    model: str
    accuracy_pct: float
    r2_score: float
    mae: float
    rmse: float
    data: list[ForecastPoint]
    next_hour_forecast: int
    confidence_pct: float
    horizon_hours: int
    feature_importance: Optional[dict[str, float]] = None


class AnomalyPoint(BaseModel):
    timestamp: str
    requests: float
    anomaly_score: float
    is_anomaly: bool
    severity: str


class AnomalyDetectionResponse(BaseModel):
    model: str
    total_points: int
    anomaly_count: int
    anomaly_rate_pct: float
    contamination: float
    points: list[AnomalyPoint]


class ModelComparisonItem(BaseModel):
    model: str
    r2: float
    mae: float
    rmse: float
    fit_time_ms: float


class ModelComparisonResponse(BaseModel):
    best_model: str
    models: list[ModelComparisonItem]
    recommendation: str


class InsightItem(BaseModel):
    type: str
    title: str
    description: str
    severity: str
    metric: Optional[float] = None


class InsightsResponse(BaseModel):
    insights: list[InsightItem]
    generated_at: str
    model_version: str
