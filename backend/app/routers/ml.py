"""
ML Router — /api/v1/ml/*

Endpoints:
  POST /ml/train              — train forecasting model
  GET  /ml/predict/traffic    — multi-horizon traffic forecast
  GET  /ml/detect/anomalies   — unsupervised anomaly detection
  GET  /ml/models/compare     — compare Linear, RF, GBM on current data
  GET  /ml/insights           — AI-generated operational insights
"""
from __future__ import annotations

import random
import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.connection import get_db
from app.models.metric import Metric
from app.models.api_endpoint import ApiEndpoint
from app.models.user import User
from app.security.dependencies import get_current_user
from app.schemas.ml import (
    TrainRequest, TrainResponse,
    ForecastResponse,
    AnomalyDetectionResponse,
    ModelComparisonResponse,
    InsightsResponse,
)
from app.services.ml_service import (
    forecast_traffic,
    detect_anomalies,
    compare_models,
    generate_insights,
)

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

FORECAST_MODELS = ["linear_regression", "random_forest", "gradient_boosting"]


async def _load_metrics(
    db: AsyncSession,
    hours: int = 168,
    api_id: int | None = None,
) -> list[Metric]:
    q = select(Metric).where(
        Metric.timestamp >= datetime.now(timezone.utc) - timedelta(hours=hours)
    ).order_by(Metric.timestamp)
    if api_id:
        q = q.where(Metric.api_id == api_id)
    result = await db.execute(q)
    return result.scalars().all()


def _synthetic_metrics(n: int = 168) -> tuple[list[datetime], list[float], list[float], list[float]]:
    """
    Generate synthetic hourly metrics for demonstration when DB is empty.
    Uses realistic daily seasonality + noise + trend.
    """
    now = datetime.now(timezone.utc)
    timestamps, requests, errors, latencies = [], [], [], []
    base = 4000.0
    for i in range(n):
        ts = now - timedelta(hours=n - i)
        hour = ts.hour
        # Daily seasonality: low at night, peak around 14:00
        season = 1 + 0.6 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 22 else 0.35
        trend  = 1 + 0.0003 * i
        noise  = random.gauss(1.0, 0.08)
        req = max(10.0, base * season * trend * noise)
        err_rate = max(0.0, random.gauss(1.2, 0.5))
        lat = max(20.0, 120 + 40 * (1 - season) + random.gauss(0, 15))
        timestamps.append(ts)
        requests.append(round(req, 1))
        errors.append(round(err_rate, 2))
        latencies.append(round(lat, 1))
    return timestamps, requests, errors, latencies


@router.post("/train", response_model=TrainResponse, status_code=200)
async def train_model(
    body: TrainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TrainResponse:
    """Train GradientBoosting forecasting model on stored metric history."""
    metrics = await _load_metrics(db, hours=body.lookback_hours, api_id=body.api_id)

    if len(metrics) < 10:
        timestamps, requests, _, _ = _synthetic_metrics(body.lookback_hours)
    else:
        timestamps = [m.timestamp for m in metrics]
        requests   = [float(m.requests) for m in metrics]

    from time import perf_counter
    from app.services.ml_service import _build_lag_features, StandardScaler, GradientBoostingRegressor, Pipeline, r2_score, mean_absolute_error
    from sklearn.model_selection import train_test_split
    import numpy as np

    lags = min(6, len(requests) // 3)
    X, y = _build_lag_features(requests, lags=lags)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=4, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)
    pred = pipeline.predict(X_test)

    r2  = float(r2_score(y_test, pred))
    mae = float(mean_absolute_error(y_test, pred))

    return TrainResponse(
        model="GradientBoostingRegressor",
        api_id=body.api_id,
        samples_used=len(requests),
        r2_score=round(r2, 4),
        mae=round(mae, 1),
        trained_at=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/predict/traffic", response_model=ForecastResponse)
async def predict_traffic(
    api_id: int | None = Query(None, description="Filter by API; None = all"),
    horizon: int = Query(6, ge=1, le=48, description="Forecast horizon in hours"),
    model: str = Query("gradient_boosting", description="Model: linear_regression | random_forest | gradient_boosting"),
    hours: int = Query(168, ge=24, le=8760, description="Historical lookback in hours"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ForecastResponse:
    """
    Forecast future traffic using the selected ML model.
    Falls back to synthetic seasonality data when the DB is empty.
    """
    if model not in FORECAST_MODELS:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"model must be one of {FORECAST_MODELS}",
        )

    metrics = await _load_metrics(db, hours=hours, api_id=api_id)

    if len(metrics) < 10:
        timestamps, requests, _, _ = _synthetic_metrics(hours)
    else:
        timestamps = [m.timestamp for m in metrics]
        requests   = [float(m.requests) for m in metrics]

    return forecast_traffic(timestamps, requests, horizon_hours=horizon, model_name=model)


@router.get("/detect/anomalies", response_model=AnomalyDetectionResponse)
async def detect_traffic_anomalies(
    api_id: int | None = Query(None),
    hours: int = Query(72, ge=12, le=720),
    contamination: float = Query(0.05, ge=0.01, le=0.25, description="Expected anomaly fraction"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AnomalyDetectionResponse:
    """
    Unsupervised anomaly detection using IsolationForest.
    Detects traffic spikes, error rate surges, and latency outliers.
    """
    metrics = await _load_metrics(db, hours=hours, api_id=api_id)

    if len(metrics) < 5:
        timestamps, requests, errors, latencies = _synthetic_metrics(hours)
    else:
        timestamps = [m.timestamp for m in metrics]
        requests   = [float(m.requests) for m in metrics]
        errors     = [float(m.error_rate) for m in metrics]
        latencies  = [float(m.avg_response_ms) for m in metrics]

    return detect_anomalies(timestamps, requests, errors, latencies, contamination=contamination)


@router.get("/models/compare", response_model=ModelComparisonResponse)
async def compare_forecasting_models(
    api_id: int | None = Query(None),
    hours: int = Query(168, ge=48, le=720),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> ModelComparisonResponse:
    """
    Train and evaluate LinearRegression, RandomForest, and GradientBoosting on the
    same dataset. Returns R², MAE, RMSE, and fit time per model plus a recommendation.
    """
    metrics = await _load_metrics(db, hours=hours, api_id=api_id)
    if len(metrics) < 10:
        _, requests, _, _ = _synthetic_metrics(hours)
    else:
        requests = [float(m.requests) for m in metrics]

    return compare_models(requests)


@router.get("/insights", response_model=InsightsResponse)
async def get_ml_insights(
    api_id: int | None = Query(None),
    hours: int = Query(48, ge=12, le=720),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InsightsResponse:
    """
    AI-generated operational insights: trend analysis, error-rate severity,
    latency SLA compliance, and volatility scoring.
    """
    metrics = await _load_metrics(db, hours=hours, api_id=api_id)
    if len(metrics) < 5:
        _, requests, errors, latencies = _synthetic_metrics(hours)
    else:
        requests  = [float(m.requests) for m in metrics]
        errors    = [float(m.error_rate) for m in metrics]
        latencies = [float(m.avg_response_ms) for m in metrics]

    return generate_insights(requests, errors, latencies)
