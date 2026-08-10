"""Add ml_predictions table for storing model run history

Revision ID: 002
Revises: 001
Create Date: 2026-08-04 01:00:00.000000
"""
from __future__ import annotations
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.create_table(
        "ml_predictions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("api_id", sa.Integer(), sa.ForeignKey("api_endpoints.id", ondelete="SET NULL"), nullable=True),
        sa.Column("model_name", sa.String(80), nullable=False),
        sa.Column("horizon_hours", sa.Integer(), nullable=False, server_default="6"),
        sa.Column("r2_score", sa.Float(), nullable=True),
        sa.Column("mae", sa.Float(), nullable=True),
        sa.Column("rmse", sa.Float(), nullable=True),
        sa.Column("samples_used", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("prediction_json", sa.Text(), nullable=True, comment="JSON array of ForecastPoints"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ml_predictions_api_id",    "ml_predictions", ["api_id"])
    op.create_index("ix_ml_predictions_model",     "ml_predictions", ["model_name"])
    op.create_index("ix_ml_predictions_created_at","ml_predictions", ["created_at"])


def downgrade() -> None:
    op.drop_table("ml_predictions")
