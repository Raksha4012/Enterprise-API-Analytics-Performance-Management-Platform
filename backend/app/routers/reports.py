import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.connection import get_db
from app.models.api_endpoint import ApiEndpoint
from app.models.metric import Metric
from app.models.user import User
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


async def _fetch_apis(db: AsyncSession) -> list[ApiEndpoint]:
    result = await db.execute(select(ApiEndpoint).order_by(ApiEndpoint.name))
    return result.scalars().all()


async def _fetch_metrics(db: AsyncSession, hours: int = 24) -> list[Metric]:
    from datetime import timedelta, timezone
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(select(Metric).where(Metric.timestamp >= since).order_by(Metric.timestamp))
    return result.scalars().all()


def _stream_csv(rows: list[list], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    for row in rows:
        writer.writerow(row)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/api-summary")
async def report_api_summary(
    format: str = Query("csv"),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    apis = await _fetch_apis(db)
    rows = [["ID", "Name", "Endpoint", "Method", "Version", "Status", "Category",
             "Total Requests", "Error Rate (%)", "Avg Response (ms)", "Uptime (%)"]]
    for a in apis:
        rows.append([
            a.id, a.name, a.endpoint, a.method.value, a.version,
            a.status.value, a.category, a.total_requests,
            round(a.error_rate, 2), round(a.avg_response_ms, 1), round(a.uptime_pct, 2),
        ])
    date = datetime.utcnow().strftime("%Y%m%d")
    return _stream_csv(rows, f"api-summary-{date}.csv")


@router.get("/traffic")
async def report_traffic(
    hours: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    metrics = await _fetch_metrics(db, hours)
    rows = [["Timestamp", "API ID", "Requests", "Errors", "Error Rate (%)", "Avg Response (ms)", "P95 (ms)"]]
    for m in metrics:
        rows.append([
            m.timestamp.isoformat(), m.api_id, m.requests, m.errors,
            round(m.error_rate, 2), round(m.avg_response_ms, 1), round(m.p95_response_ms, 1),
        ])
    date = datetime.utcnow().strftime("%Y%m%d")
    return _stream_csv(rows, f"traffic-{date}.csv")


@router.get("/sla-compliance")
async def report_sla(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    apis = await _fetch_apis(db)
    rows = [["API Name", "Uptime (%)", "Avg Response (ms)", "Error Rate (%)", "SLA Status"]]
    for a in apis:
        sla_ok = a.uptime_pct >= 99.9 and a.avg_response_ms <= 500 and a.error_rate <= 1.0
        rows.append([
            a.name, round(a.uptime_pct, 3), round(a.avg_response_ms, 1),
            round(a.error_rate, 2), "PASS" if sla_ok else "FAIL",
        ])
    date = datetime.utcnow().strftime("%Y%m%d")
    return _stream_csv(rows, f"sla-compliance-{date}.csv")


@router.get("/incident-summary")
async def report_incidents(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from app.models.metric import Anomaly
    result = await db.execute(
        select(Anomaly, ApiEndpoint.name)
        .join(ApiEndpoint, Anomaly.api_id == ApiEndpoint.id)
        .order_by(Anomaly.detected_at.desc())
    )
    rows = [["Detected At", "API", "Type", "Severity", "Description", "Resolved"]]
    for anomaly, api_name in result.all():
        rows.append([
            anomaly.detected_at.isoformat(), api_name, anomaly.anomaly_type,
            anomaly.severity, anomaly.description or "", "Yes" if anomaly.resolved else "No",
        ])
    date = datetime.utcnow().strftime("%Y%m%d")
    return _stream_csv(rows, f"incidents-{date}.csv")
