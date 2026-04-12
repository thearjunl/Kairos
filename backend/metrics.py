"""
Real-time metric calculations for the FinOps Sentinel dashboard.
"""
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from models import Transaction
from datetime import datetime, timedelta


def compute_health_score(success_rate: float, sla_compliance: float, avg_latency: float) -> int:
    """
    Health score formula:
    health_score = (success_rate * 0.5) + (sla_compliance * 0.3) + (max(0, 100 - avg_latency/5) * 0.2)
    Clamped to 0–100.
    """
    score = (success_rate * 0.5) + (sla_compliance * 0.3) + (max(0, 100 - avg_latency / 5) * 0.2)
    return max(0, min(100, int(score)))


async def get_aggregated_metrics(session: AsyncSession) -> dict:
    """Compute aggregated metrics from the last 100 transactions."""
    # Fetch latest 100 transactions
    stmt = select(Transaction).order_by(desc(Transaction.id)).limit(100)
    result = await session.execute(stmt)
    transactions = result.scalars().all()

    if not transactions:
        return {
            "health_score": 100,
            "success_rate": 100.0,
            "avg_latency": 0.0,
            "sla_compliance": 100.0,
            "total_breaches": 0,
            "throughput_per_min": 0,
            "region_health": {},
        }

    total = len(transactions)
    success_count = sum(1 for t in transactions if t.status == "success")
    sla_compliant = sum(1 for t in transactions if t.latency_ms < 200)
    total_latency = sum(t.latency_ms for t in transactions)
    breach_count = sum(1 for t in transactions if t.latency_ms >= 200)

    success_rate = (success_count / total) * 100
    avg_latency = total_latency / total
    sla_compliance = (sla_compliant / total) * 100
    health_score = compute_health_score(success_rate, sla_compliance, avg_latency)

    # Throughput: transactions in the last 60 seconds
    now = datetime.utcnow()
    one_min_ago = now - timedelta(seconds=60)
    recent_count = sum(1 for t in transactions if t.timestamp and t.timestamp >= one_min_ago)

    # Per-region health
    region_data: dict[str, dict] = {}
    for t in transactions:
        if t.cloud_region not in region_data:
            region_data[t.cloud_region] = {"total": 0, "success": 0, "latency_sum": 0}
        region_data[t.cloud_region]["total"] += 1
        if t.status == "success":
            region_data[t.cloud_region]["success"] += 1
        region_data[t.cloud_region]["latency_sum"] += t.latency_ms

    region_health = {}
    for region, data in region_data.items():
        region_health[region] = {
            "success_rate": round((data["success"] / data["total"]) * 100, 1) if data["total"] else 0,
            "avg_latency": round(data["latency_sum"] / data["total"], 1) if data["total"] else 0,
        }

    return {
        "health_score": health_score,
        "success_rate": round(success_rate, 1),
        "avg_latency": round(avg_latency, 1),
        "sla_compliance": round(sla_compliance, 1),
        "total_breaches": breach_count,
        "throughput_per_min": recent_count,
        "region_health": region_health,
    }
