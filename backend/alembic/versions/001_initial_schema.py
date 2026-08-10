"""Initial schema — users, api_endpoints, metrics, anomalies

Revision ID: 001
Revises:
Create Date: 2026-08-04 00:00:00.000000
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: str | None = None
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("username", sa.String(80), unique=True, nullable=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("admin", "developer", "viewer", name="userrole"), nullable=False, server_default="viewer"),
        sa.Column("department", sa.String(80), nullable=True),
        sa.Column("status", sa.Enum("active", "inactive", "pending", name="userstatus"), nullable=False, server_default="active"),
        sa.Column("api_access_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_users_email",    "users", ["email"],    unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_role",     "users", ["role"])

    # ── api_endpoints ──────────────────────────────────────────────────────
    op.create_table(
        "api_endpoints",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("endpoint", sa.String(500), nullable=False, unique=True),
        sa.Column("method", sa.String(10), nullable=False, server_default="GET"),
        sa.Column("version", sa.String(20), nullable=True),
        sa.Column("owner", sa.String(120), nullable=True),
        sa.Column("category", sa.String(80), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="healthy"),
        sa.Column("uptime_pct", sa.Float(), nullable=False, server_default="100.0"),
        sa.Column("avg_response_ms", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("error_rate_pct", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("total_requests", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_api_endpoints_status",   "api_endpoints", ["status"])
    op.create_index("ix_api_endpoints_category", "api_endpoints", ["category"])

    # ── metrics ───────────────────────────────────────────────────────────
    op.create_table(
        "metrics",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("api_id", sa.Integer(), sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("requests", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("errors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_response_ms", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p95_response_ms", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("p99_response_ms", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("error_rate", sa.Float(), nullable=False, server_default="0.0"),
    )
    op.create_index("ix_metrics_api_id",    "metrics", ["api_id"])
    op.create_index("ix_metrics_timestamp", "metrics", ["timestamp"])
    # Composite index for the most common query pattern: api + time range
    op.create_index("ix_metrics_api_ts", "metrics", ["api_id", "timestamp"])

    # ── anomalies ─────────────────────────────────────────────────────────
    op.create_table(
        "anomalies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("api_id", sa.Integer(), sa.ForeignKey("api_endpoints.id", ondelete="CASCADE"), nullable=False),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("anomaly_type", sa.String(80), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False, server_default="warning"),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_anomalies_api_id",  "anomalies", ["api_id"])
    op.create_index("ix_anomalies_resolved","anomalies", ["resolved"])


def downgrade() -> None:
    op.drop_table("anomalies")
    op.drop_table("metrics")
    op.drop_table("api_endpoints")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS userstatus")
