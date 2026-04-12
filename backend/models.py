"""
SQLAlchemy ORM models for FinOps Sentinel
"""
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    transaction_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    merchant_raw: Mapped[str] = mapped_column(String(50))
    merchant_name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    amount: Mapped[float] = mapped_column(Float)
    cloud_region: Mapped[str] = mapped_column(String(50))
    latency_ms: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20))
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    has_pii_risk: Mapped[bool] = mapped_column(Boolean, default=False)
    rca_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    rca_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MetricsSnapshot(Base):
    __tablename__ = "metrics_snapshot"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    success_rate: Mapped[float] = mapped_column(Float)
    avg_latency: Mapped[float] = mapped_column(Float)
    sla_compliance: Mapped[float] = mapped_column(Float)
    total_txns: Mapped[int] = mapped_column(Integer)
    breach_count: Mapped[int] = mapped_column(Integer)
    health_score: Mapped[int] = mapped_column(Integer)
