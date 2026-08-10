"""Unit tests for the ML service layer (no DB required)."""
import math
import pytest
from datetime import datetime, timedelta, timezone

from app.services.ml_service import (
    forecast_traffic,
    detect_anomalies,
    compare_models,
    generate_insights,
    _moving_average,
    _exponential_smoothing,
    _build_lag_features,
)


def _make_timestamps(n: int = 100) -> list[datetime]:
    now = datetime.now(timezone.utc)
    return [now - timedelta(hours=n - i) for i in range(n)]


def _make_traffic(n: int = 100) -> list[float]:
    """Sinusoidal traffic pattern with noise."""
    import random
    return [
        max(100.0, 3000 + 1500 * math.sin(2 * math.pi * i / 24) + random.gauss(0, 150))
        for i in range(n)
    ]


# ── Utility helpers ────────────────────────────────────────────────────

class TestMovingAverage:
    def test_basic(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = _moving_average(values, window=3)
        assert result[0] is None
        assert result[1] is None
        assert abs(result[2] - 2.0) < 1e-6
        assert abs(result[4] - 4.0) < 1e-6

    def test_window_1(self):
        values = [10.0, 20.0, 30.0]
        result = _moving_average(values, window=1)
        assert all(r is not None for r in result)


class TestExponentialSmoothing:
    def test_length_preserved(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = _exponential_smoothing(values, alpha=0.3)
        assert len(result) == len(values)

    def test_first_element_unchanged(self):
        values = [5.0, 10.0, 15.0]
        result = _exponential_smoothing(values, alpha=0.5)
        assert result[0] == 5.0

    def test_smoothing_reduces_variance(self):
        import statistics
        values = [1.0, 100.0, 1.0, 100.0, 1.0, 100.0]
        smoothed = _exponential_smoothing(values, alpha=0.1)
        assert statistics.stdev(smoothed) < statistics.stdev(values)


class TestLagFeatures:
    def test_shape(self):
        values = list(range(20))
        X, y = _build_lag_features(values, lags=5)
        assert X.shape[1] == 5 + 3  # lags + trend + sin + cos
        assert len(X) == len(y) == 20 - 5

    def test_too_few_raises(self):
        with pytest.raises(ValueError):
            _build_lag_features([1.0, 2.0], lags=6)


# ── Forecasting ────────────────────────────────────────────────────────

class TestForecastTraffic:
    def test_returns_forecast_response(self):
        ts = _make_timestamps(80)
        vals = _make_traffic(80)
        result = forecast_traffic(ts, vals, horizon_hours=6, model_name="linear_regression")
        assert result.model is not None
        assert result.horizon_hours == 6
        assert len(result.data) >= 6

    @pytest.mark.parametrize("model_name", ["linear_regression", "random_forest", "gradient_boosting"])
    def test_all_models(self, model_name):
        ts = _make_timestamps(60)
        vals = _make_traffic(60)
        result = forecast_traffic(ts, vals, horizon_hours=3, model_name=model_name)
        assert result.r2_score <= 1.0
        assert result.mae >= 0.0
        assert result.rmse >= 0.0

    def test_forecast_points_have_bounds(self):
        ts = _make_timestamps(50)
        vals = _make_traffic(50)
        result = forecast_traffic(ts, vals, horizon_hours=6)
        future = [p for p in result.data if p.predicted is not None and p.actual is None]
        assert len(future) == 6
        for p in future:
            assert p.lower is not None
            assert p.upper is not None
            assert p.lower <= p.predicted <= p.upper

    def test_fallback_sparse_data(self):
        ts = _make_timestamps(3)
        vals = _make_traffic(3)
        result = forecast_traffic(ts, vals, horizon_hours=4)
        # Should not raise — uses EMA fallback
        assert result is not None
        assert result.next_hour_forecast >= 0

    def test_feature_importance_present_for_tree_models(self):
        ts = _make_timestamps(60)
        vals = _make_traffic(60)
        result = forecast_traffic(ts, vals, model_name="gradient_boosting")
        assert result.feature_importance is not None
        assert len(result.feature_importance) > 0


# ── Anomaly detection ──────────────────────────────────────────────────

class TestDetectAnomalies:
    def test_basic(self):
        ts = _make_timestamps(50)
        vals = _make_traffic(50)
        result = detect_anomalies(ts, vals)
        assert result.total_points == 50
        assert result.anomaly_count >= 0
        assert 0.0 <= result.anomaly_rate_pct <= 100.0

    def test_injected_spike_detected(self):
        ts = _make_timestamps(60)
        vals = _make_traffic(60)
        # Inject a clear spike at index 30
        vals[30] = vals[30] * 20
        result = detect_anomalies(ts, vals, contamination=0.10)
        anomaly_idxs = [i for i, p in enumerate(result.points) if p.is_anomaly]
        assert 30 in anomaly_idxs

    def test_all_points_returned(self):
        ts = _make_timestamps(40)
        vals = _make_traffic(40)
        errs = [1.5] * 40
        lats = [120.0] * 40
        result = detect_anomalies(ts, vals, errs, lats)
        assert len(result.points) == 40

    def test_too_few_points_returns_empty(self):
        result = detect_anomalies([], [1.0, 2.0], contamination=0.05)
        assert result.anomaly_count == 0


# ── Model comparison ───────────────────────────────────────────────────

class TestCompareModels:
    def test_returns_three_models(self):
        vals = _make_traffic(80)
        result = compare_models(vals)
        assert len(result.models) == 3
        names = {m.name for m in result.models}
        assert "Linear Regression" in names
        assert "Random Forest" in names
        assert "Gradient Boosting" in names

    def test_best_model_is_in_list(self):
        vals = _make_traffic(80)
        result = compare_models(vals)
        names = {m.name for m in result.models}
        assert result.best_model in names

    def test_insufficient_data(self):
        result = compare_models([100.0, 200.0])
        assert len(result.models) == 0
        assert "Insufficient" in result.recommendation


# ── Insights ───────────────────────────────────────────────────────────

class TestGenerateInsights:
    def test_returns_insights(self):
        vals = _make_traffic(48)
        errs = [1.5] * 48
        lats = [140.0] * 48
        result = generate_insights(vals, errs, lats)
        assert len(result.insights) > 0
        assert result.generated_at is not None

    def test_high_error_rate_flagged(self):
        vals = _make_traffic(48)
        errs = [8.0] * 48  # very high
        lats = [100.0] * 48
        result = generate_insights(vals, errs, lats)
        error_insights = [i for i in result.insights if i.type == "error_rate"]
        assert any(i.severity == "error" for i in error_insights)

    def test_empty_data(self):
        result = generate_insights([], [], [])
        assert result.insights == []

    def test_insight_severities_valid(self):
        vals = _make_traffic(48)
        result = generate_insights(vals, [2.0] * 48, [300.0] * 48)
        valid = {"info", "warning", "error"}
        for i in result.insights:
            assert i.severity in valid
