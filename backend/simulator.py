"""
Transaction log generator — continuous stream of mock banking transactions.
Supports normal and anomaly modes.
"""
import random
import string
import asyncio
from datetime import datetime

# ─── Merchant Pool ───────────────────────────────────────────────────────────
MERCHANTS = [
    {"raw_prefix": "AMZ_TXN",  "name": "Amazon.com",   "category": "E-Commerce"},
    {"raw_prefix": "SWG_TXN",  "name": "Swiggy",       "category": "Food Delivery"},
    {"raw_prefix": "NFL_TXN",  "name": "Netflix",       "category": "Entertainment"},
    {"raw_prefix": "UBR_TXN",  "name": "Uber",          "category": "Transport"},
    {"raw_prefix": "ZMT_TXN",  "name": "Zomato",        "category": "Food Delivery"},
    {"raw_prefix": "HDFC_TXN", "name": "HDFC Bank",     "category": "Banking"},
    {"raw_prefix": "ART_TXN",  "name": "Airtel",        "category": "Telecom"},
    {"raw_prefix": "BGM_TXN",  "name": "BigMart",       "category": "Groceries"},
    {"raw_prefix": "IRC_TXN",  "name": "IRCTC",         "category": "Travel"},
    {"raw_prefix": "MYN_TXN",  "name": "Myntra",        "category": "Fashion"},
    {"raw_prefix": "PTM_TXN",  "name": "Paytm",         "category": "Payments"},
    {"raw_prefix": "GPY_TXN",  "name": "Google Pay",    "category": "Payments"},
]

REGIONS = ["Azure East-US", "Azure West-EU", "AWS ap-south-1", "GCP us-central"]

ERROR_CODES = [
    "HTTP_504", "HTTP_503", "ENRICHMENT_TIMEOUT", "DB_CONN_EXHAUSTED",
    "KAFKA_LAG_HIGH", "NLP_SCORE_LOW", "RATE_LIMIT_429", "TLS_HANDSHAKE_FAIL",
]

# ─── Anomaly State ───────────────────────────────────────────────────────────
_anomaly_active = False
_anomaly_end_time: float = 0


def activate_anomaly(duration_seconds: int = 30):
    """Activate anomaly mode for a given duration."""
    global _anomaly_active, _anomaly_end_time
    import time
    _anomaly_active = True
    _anomaly_end_time = time.time() + duration_seconds


def clear_anomaly():
    """Immediately clear anomaly mode."""
    global _anomaly_active, _anomaly_end_time
    _anomaly_active = False
    _anomaly_end_time = 0


def is_anomaly_active() -> bool:
    """Check if anomaly mode is currently active, auto-revert if expired."""
    global _anomaly_active
    import time
    if _anomaly_active and time.time() >= _anomaly_end_time:
        _anomaly_active = False
    return _anomaly_active


# ─── Transaction Generator ──────────────────────────────────────────────────
def generate_transaction() -> dict:
    """Generate a single mock transaction based on current mode."""
    anomaly = is_anomaly_active()
    merchant = random.choice(MERCHANTS)

    # TXN ID
    suffix = ''.join(random.choices(string.digits, k=5))
    txn_id = f"TXN-{suffix}"

    # Raw merchant ID
    raw_suffix = ''.join(random.choices(string.digits, k=3))
    merchant_raw = f"{merchant['raw_prefix']}_{raw_suffix}"

    # Amount: ₹5 – ₹5000
    amount = round(random.uniform(5, 5000), 2)

    # Region
    region = random.choice(REGIONS)

    # Status distribution
    if anomaly:
        roll = random.random()
        if roll < 0.45:
            status = "success"
        elif roll < 0.70:
            status = "degraded"
        else:
            status = "fail"
    else:
        roll = random.random()
        if roll < 0.88:
            status = "success"
        elif roll < 0.96:
            status = "degraded"
        else:
            status = "fail"

    # Latency
    if status == "success":
        base_latency = random.randint(30, 180)
    elif status == "degraded":
        base_latency = random.randint(200, 350)
    else:
        base_latency = random.randint(400, 900)

    if anomaly:
        multiplier = random.uniform(3, 5)
        latency_ms = int(base_latency * multiplier)
    else:
        latency_ms = base_latency

    # Error code
    error_code = random.choice(ERROR_CODES) if status == "fail" else None

    # PII risk (~3%)
    has_pii_risk = random.random() < 0.03

    return {
        "transaction_id": txn_id,
        "merchant_raw": merchant_raw,
        "merchant_name": merchant["name"],
        "category": merchant["category"],
        "amount": amount,
        "cloud_region": region,
        "latency_ms": latency_ms,
        "status": status,
        "error_code": error_code,
        "has_pii_risk": has_pii_risk,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def generate_seed_transactions(count: int = 50) -> list[dict]:
    """Generate a batch of seed transactions for DB initialization."""
    return [generate_transaction() for _ in range(count)]
