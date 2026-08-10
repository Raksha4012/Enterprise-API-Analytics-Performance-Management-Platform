"""
Database seeder — populates initial demo data for ApiPulse.

Usage:
    python -m app.database.seed

Idempotent: safely re-runnable; skips existing records.
"""
from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.config.settings import get_settings
from app.database.connection import Base
from app.models.user import User, UserRole, UserStatus
from app.models.api_endpoint import ApiEndpoint
from app.models.metric import Metric, Anomaly

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()

# ── Seed data ──────────────────────────────────────────────────────────────

SEED_USERS = [
    {"name": "Alexandra Chen",  "email": "alex.chen@acme.com",   "password": "Admin@2026",  "role": UserRole.admin,     "department": "Platform",   "status": UserStatus.active},
    {"name": "Marcus Johnson",  "email": "m.johnson@acme.com",   "password": "Dev@2026!",   "role": UserRole.developer, "department": "Payments",   "status": UserStatus.active},
    {"name": "Sarah Williams",  "email": "s.williams@acme.com",  "password": "Dev@2026!",   "role": UserRole.developer, "department": "Commerce",   "status": UserStatus.active},
    {"name": "David Park",      "email": "d.park@acme.com",      "password": "View@2026!",  "role": UserRole.viewer,    "department": "Analytics",  "status": UserStatus.active},
    {"name": "Emma Rodriguez",  "email": "e.rodriguez@acme.com", "password": "Dev@2026!",   "role": UserRole.developer, "department": "Data",       "status": UserStatus.inactive},
    {"name": "James Wilson",    "email": "j.wilson@acme.com",    "password": "Admin@2026",  "role": UserRole.admin,     "department": "Security",   "status": UserStatus.active},
    {"name": "Priya Patel",     "email": "p.patel@acme.com",     "password": "Dev@2026!",   "role": UserRole.developer, "department": "Search",     "status": UserStatus.active},
]

SEED_APIS = [
    {"name": "User Authentication API",   "endpoint": "/api/v2/auth",       "method": "POST", "version": "v2.4.1", "owner": "Platform Team",  "status": "healthy", "category": "Security",    "description": "JWT-based authentication and token management",           "uptime_pct": 99.98, "avg_response_ms": 124.0, "error_rate_pct": 0.8,  "total_requests": 4280000},
    {"name": "Payment Processing API",    "endpoint": "/api/v1/payments",    "method": "POST", "version": "v1.8.3", "owner": "Payments Team",  "status": "warning", "category": "Finance",     "description": "Stripe-integrated payment processing and refunds",         "uptime_pct": 99.72, "avg_response_ms": 456.0, "error_rate_pct": 2.3,  "total_requests": 2140000},
    {"name": "Product Catalog API",       "endpoint": "/api/v3/products",    "method": "GET",  "version": "v3.1.0", "owner": "Commerce Team",  "status": "healthy", "category": "Commerce",    "description": "Product listing, search, and inventory management",        "uptime_pct": 99.99, "avg_response_ms": 89.0,  "error_rate_pct": 0.4,  "total_requests": 8920000},
    {"name": "Analytics Ingestion API",   "endpoint": "/api/v2/events",      "method": "POST", "version": "v2.0.7", "owner": "Data Team",      "status": "healthy", "category": "Analytics",   "description": "Real-time event ingestion and stream processing",          "uptime_pct": 99.97, "avg_response_ms": 67.0,  "error_rate_pct": 0.2,  "total_requests": 12450000},
    {"name": "Notification Service API",  "endpoint": "/api/v1/notify",      "method": "POST", "version": "v1.5.2", "owner": "Comms Team",     "status": "slow",    "category": "Messaging",   "description": "Multi-channel push, email, and SMS notifications",         "uptime_pct": 99.45, "avg_response_ms": 678.0, "error_rate_pct": 1.8,  "total_requests": 1890000},
    {"name": "User Profile API",          "endpoint": "/api/v2/users",       "method": "GET",  "version": "v2.3.4", "owner": "Platform Team",  "status": "healthy", "category": "Users",       "description": "User profile management and preference storage",           "uptime_pct": 99.96, "avg_response_ms": 112.0, "error_rate_pct": 0.6,  "total_requests": 6340000},
    {"name": "Search API",                "endpoint": "/api/v3/search",      "method": "GET",  "version": "v3.0.2", "owner": "Search Team",    "status": "healthy", "category": "Search",      "description": "Full-text search powered by Elasticsearch",               "uptime_pct": 99.98, "avg_response_ms": 134.0, "error_rate_pct": 0.3,  "total_requests": 9870000},
    {"name": "Order Management API",      "endpoint": "/api/v2/orders",      "method": "POST", "version": "v2.1.5", "owner": "Commerce Team",  "status": "down",    "category": "Commerce",    "description": "Order lifecycle management and fulfillment",              "uptime_pct": 97.82, "avg_response_ms": 1240.0,"error_rate_pct": 8.4,  "total_requests": 3120000},
    {"name": "Inventory API",             "endpoint": "/api/v1/inventory",   "method": "GET",  "version": "v1.9.1", "owner": "Ops Team",       "status": "healthy", "category": "Operations",  "description": "Real-time inventory tracking and warehouse sync",         "uptime_pct": 99.94, "avg_response_ms": 98.0,  "error_rate_pct": 0.5,  "total_requests": 4560000},
    {"name": "Reporting API",             "endpoint": "/api/v2/reports",     "method": "GET",  "version": "v2.2.0", "owner": "BI Team",        "status": "warning", "category": "Analytics",   "description": "Scheduled and on-demand business intelligence reports",   "uptime_pct": 99.12, "avg_response_ms": 2340.0,"error_rate_pct": 3.1,  "total_requests": 890000},
]


def _generate_metrics(api_id: int, base_requests: int, base_response: float, base_error: float, hours: int = 168) -> list[Metric]:
    """Generate `hours` of realistic hourly metrics for an API."""
    now = datetime.now(timezone.utc)
    metrics = []
    for h in range(hours):
        ts = now - timedelta(hours=hours - h)
        hour_of_day = ts.hour
        # Daily seasonality
        season = 1.0 + 0.6 * math.sin(math.pi * (hour_of_day - 6) / 12) if 6 <= hour_of_day <= 22 else 0.35
        noise = random.gauss(1.0, 0.08)
        req = max(1, int(base_requests * season * noise / 24))
        err_rate = max(0.0, random.gauss(base_error, base_error * 0.2))
        errs = max(0, int(req * err_rate / 100))
        avg_resp = max(10.0, random.gauss(base_response, base_response * 0.15))
        metrics.append(Metric(
            api_id=api_id,
            timestamp=ts,
            requests=req,
            errors=errs,
            avg_response_ms=round(avg_resp, 1),
            p95_response_ms=round(avg_resp * 1.8, 1),
            p99_response_ms=round(avg_resp * 2.5, 1),
            error_rate=round(err_rate, 3),
        ))
    return metrics


async def seed(db: AsyncSession) -> None:
    print("🌱 Seeding database…")

    # ── Users ──────────────────────────────────────────────────────────
    for u in SEED_USERS:
        existing = await db.execute(select(User).where(User.email == u["email"]))
        if existing.scalar_one_or_none():
            continue
        db.add(User(
            name=u["name"],
            email=u["email"],
            hashed_password=pwd_context.hash(u["password"]),
            role=u["role"],
            status=u["status"],
            last_login=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 72)),
        ))
    await db.commit()
    print(f"  ✓ {len(SEED_USERS)} users")

    # ── APIs ───────────────────────────────────────────────────────────
    api_ids: dict[str, int] = {}
    for api_data in SEED_APIS:
        existing = await db.execute(select(ApiEndpoint).where(ApiEndpoint.endpoint == api_data["endpoint"]))
        existing_obj = existing.scalar_one_or_none()
        if existing_obj:
            api_ids[api_data["endpoint"]] = existing_obj.id
            continue
        api = ApiEndpoint(**{k: v for k, v in api_data.items()})
        db.add(api)
        await db.flush()
        api_ids[api_data["endpoint"]] = api.id
    await db.commit()
    print(f"  ✓ {len(SEED_APIS)} API endpoints")

    # ── Metrics ────────────────────────────────────────────────────────
    total_metrics = 0
    for api_data in SEED_APIS:
        api_id = api_ids.get(api_data["endpoint"])
        if not api_id:
            continue
        # Check if metrics already exist
        count_q = await db.execute(select(Metric).where(Metric.api_id == api_id).limit(1))
        if count_q.scalar_one_or_none():
            continue
        metrics = _generate_metrics(
            api_id,
            base_requests=api_data["total_requests"] // 720,  # per hour over 30 days
            base_response=api_data["avg_response_ms"],
            base_error=api_data["error_rate_pct"],
            hours=168,
        )
        db.add_all(metrics)
        total_metrics += len(metrics)
    await db.commit()
    print(f"  ✓ {total_metrics} metric records (7 days × 10 APIs)")

    # ── Anomalies ──────────────────────────────────────────────────────
    anomaly_seeds = [
        {"api_endpoint": "/api/v2/orders",   "type": "High Error Rate",    "severity": "error",   "desc": "Error rate spiked to 8.4% — 5x above SLA threshold",                          "resolved": False},
        {"api_endpoint": "/api/v1/notify",   "type": "Slow Response",      "severity": "warning", "desc": "P95 latency exceeds 1200ms threshold for 8 consecutive minutes",              "resolved": False},
        {"api_endpoint": "/api/v3/products", "type": "Traffic Spike",      "severity": "warning", "desc": "340% above normal traffic baseline detected — autoscaling triggered",         "resolved": False},
        {"api_endpoint": "/api/v2/auth",     "type": "Suspicious Activity","severity": "error",   "desc": "Brute-force pattern: 1,240 failed logins from 3 IPs in 10 minutes",           "resolved": True},
        {"api_endpoint": "/api/v3/search",   "type": "Traffic Spike",      "severity": "info",    "desc": "180% traffic increase — within automated scaling capacity",                    "resolved": True},
    ]
    for a in anomaly_seeds:
        api_id = api_ids.get(a["api_endpoint"])
        if not api_id:
            continue
        existing = await db.execute(
            select(Anomaly).where(Anomaly.api_id == api_id, Anomaly.anomaly_type == a["type"])
        )
        if existing.scalar_one_or_none():
            continue
        db.add(Anomaly(
            api_id=api_id,
            anomaly_type=a["type"],
            severity=a["severity"],
            description=a["desc"],
            resolved=a["resolved"],
            detected_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 180)),
            resolved_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 30)) if a["resolved"] else None,
        ))
    await db.commit()
    print(f"  ✓ {len(anomaly_seeds)} anomaly records")
    print("✅ Seed complete!")


async def main():
    engine = create_async_engine(settings.database_url, echo=False)
    AsyncSession_ = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with AsyncSession_() as session:
        await seed(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
