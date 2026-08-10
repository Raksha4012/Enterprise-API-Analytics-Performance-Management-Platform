"""Integration tests for the ML API endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_predict_traffic_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/ml/predict/traffic")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_predict_traffic_authenticated(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/ml/predict/traffic", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "model" in data
    assert "data" in data
    assert "r2_score" in data
    assert "next_hour_forecast" in data
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
@pytest.mark.parametrize("model", ["linear_regression", "random_forest", "gradient_boosting"])
async def test_predict_traffic_all_models(client: AsyncClient, auth_headers: dict, model: str):
    response = await client.get(
        f"/api/v1/ml/predict/traffic?model={model}&horizon=3",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_hours"] == 3


@pytest.mark.asyncio
async def test_predict_traffic_invalid_model(client: AsyncClient, auth_headers: dict):
    response = await client.get(
        "/api/v1/ml/predict/traffic?model=nonexistent_model",
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_detect_anomalies(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/ml/detect/anomalies", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "model" in data
    assert "total_points" in data
    assert "anomaly_count" in data
    assert "points" in data
    assert data["model"] == "IsolationForest"


@pytest.mark.asyncio
async def test_compare_models(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/ml/models/compare", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "best_model" in data
    assert "models" in data
    assert "recommendation" in data


@pytest.mark.asyncio
async def test_insights(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/ml/insights", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert "generated_at" in data
    assert isinstance(data["insights"], list)


@pytest.mark.asyncio
async def test_train_model(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/ml/train",
        json={"lookback_hours": 48},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "r2_score" in data
    assert "mae" in data
    assert "samples_used" in data
    assert data["model"] == "GradientBoostingRegressor"
