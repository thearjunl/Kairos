"""
Kairos Anomaly Detector — Pattern-based anomaly detection for transaction streams.
Detects failure rate spikes, latency anomalies, error clustering, and region hotspots.
"""
from datetime import datetime
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from models import Transaction


async def detect_anomalies(session: AsyncSession) -> list[dict]:
    """
    Analyze recent transactions for anomaly patterns.
    Returns a list of detected anomaly alerts.
    """
    # Fetch last 100 transactions
    stmt = select(Transaction).order_by(desc(Transaction.id)).limit(100)
    result = await session.execute(stmt)
    transactions = result.scalars().all()

    if len(transactions) < 20:
        return []

    alerts = []
    now = datetime.utcnow().isoformat()

    # ─── 1. Failure Rate Spike Detection ─────────────────────────────────────
    recent_20 = transactions[:20]
    rolling_100 = transactions

    recent_fail_rate = sum(1 for t in recent_20 if t.status == "fail") / len(recent_20)
    rolling_fail_rate = sum(1 for t in rolling_100 if t.status == "fail") / len(rolling_100)

    if rolling_fail_rate > 0 and recent_fail_rate > rolling_fail_rate * 2:
        alerts.append({
            "type": "failure_rate_spike",
            "severity": "critical" if recent_fail_rate > 0.3 else "warning",
            "message": f"Failure rate spiked to {recent_fail_rate*100:.0f}% (last 20 txns) vs {rolling_fail_rate*100:.0f}% rolling average",
            "affected_entity": "transaction_pipeline",
            "timestamp": now,
        })

    # ─── 2. Latency Anomaly Detection ────────────────────────────────────────
    recent_10 = transactions[:10]
    recent_10_avg = sum(t.latency_ms for t in recent_10) / len(recent_10)
    rolling_avg = sum(t.latency_ms for t in rolling_100) / len(rolling_100)

    if rolling_avg > 0 and recent_10_avg > rolling_avg * 3:
        alerts.append({
            "type": "latency_anomaly",
            "severity": "critical" if recent_10_avg > 500 else "warning",
            "message": f"Avg latency surged to {recent_10_avg:.0f}ms (last 10 txns) vs {rolling_avg:.0f}ms rolling average — 3x threshold exceeded",
            "affected_entity": "latency_pipeline",
            "timestamp": now,
        })

    # ─── 3. Error Code Clustering ────────────────────────────────────────────
    error_counts: dict[str, int] = {}
    for t in recent_20:
        if t.error_code:
            error_counts[t.error_code] = error_counts.get(t.error_code, 0) + 1

    for error_code, count in error_counts.items():
        if count >= 3:
            alerts.append({
                "type": "error_clustering",
                "severity": "critical" if count >= 5 else "warning",
                "message": f"Error code {error_code} appeared {count} times in last 20 transactions — possible systemic failure",
                "affected_entity": error_code,
                "timestamp": now,
            })

    # ─── 4. Region Hotspot Detection ─────────────────────────────────────────
    last_50 = transactions[:50]
    region_failures: dict[str, int] = {}
    total_failures = 0

    for t in last_50:
        if t.status == "fail":
            total_failures += 1
            region_failures[t.cloud_region] = region_failures.get(t.cloud_region, 0) + 1

    if total_failures > 3:
        for region, count in region_failures.items():
            if count / total_failures > 0.6:
                alerts.append({
                    "type": "region_hotspot",
                    "severity": "critical",
                    "message": f"Region {region} accounts for {count}/{total_failures} failures ({count/total_failures*100:.0f}%) — possible regional outage",
                    "affected_entity": region,
                    "timestamp": now,
                })

    # ─── 5. PII Burst Detection ──────────────────────────────────────────────
    pii_count = sum(1 for t in recent_20 if t.has_pii_risk)
    if pii_count >= 3:
        alerts.append({
            "type": "pii_burst",
            "severity": "critical",
            "message": f"PII risk detected in {pii_count} of last 20 transactions — ISO 27001 §A.18.1 compliance alert",
            "affected_entity": "data_privacy",
            "timestamp": now,
        })

    return alerts
