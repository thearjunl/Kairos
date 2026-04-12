"""
Kairos — FastAPI Backend
SSE streaming, anomaly injection, Gemini RCA, and observability metrics.
Production-ready with rate limiting, API key auth, and global error handling.
"""
import asyncio
import json
import os
import time
from datetime import datetime, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends, Security, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from sqlalchemy import select, desc, func
from dotenv import load_dotenv

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from database import init_db, async_session
from models import Transaction, MetricsSnapshot
from simulator import generate_transaction, generate_seed_transactions, activate_anomaly, clear_anomaly, is_anomaly_active
from metrics import get_aggregated_metrics
from ai_triage import generate_rca

load_dotenv()

# ─── Startup time tracking ──────────────────────────────────────────────────
_start_time = time.time()

# ─── Rate Limiter ────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─── API Key Auth ────────────────────────────────────────────────────────────
API_KEY = os.getenv("API_SECRET_KEY")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Security(api_key_header)):
    """Verify API key for protected endpoints. Skipped if no key is configured."""
    if API_KEY and key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return key


# ─── Lifespan ────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and seed data on startup."""
    await init_db()

    # Seed 50 transactions so dashboard isn't empty
    seed_txns = await generate_seed_transactions(50)
    async with async_session() as session:
        for txn_data in seed_txns:
            txn = Transaction(
                transaction_id=txn_data["transaction_id"],
                merchant_raw=txn_data["merchant_raw"],
                merchant_name=txn_data["merchant_name"],
                category=txn_data["category"],
                amount=txn_data["amount"],
                cloud_region=txn_data["cloud_region"],
                latency_ms=txn_data["latency_ms"],
                status=txn_data["status"],
                error_code=txn_data["error_code"],
                has_pii_risk=txn_data["has_pii_risk"],
                timestamp=datetime.fromisoformat(txn_data["timestamp"]),
            )
            session.add(txn)
        await session.commit()

    yield


app = FastAPI(
    title="Kairos API",
    description="Real-time fintech observability backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Rate limiter state ──────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS — Configurable origins ─────────────────────────────────────────────
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Global Exception Handler ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("APP_ENV") == "development" else "Contact support"
        }
    )


# ─── Pydantic Models ────────────────────────────────────────────────────────
class AnomalyRequest(BaseModel):
    duration_seconds: int = 30


class RCARequest(BaseModel):
    transaction_id: str


# ─── SSE Stream ──────────────────────────────────────────────────────────────
@app.get("/stream")
async def stream_transactions(request: Request):
    """Server-Sent Events endpoint — generates 1 transaction per 700ms."""

    async def event_generator():
        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            txn_data = generate_transaction()

            # Save to DB
            async with async_session() as session:
                txn = Transaction(
                    transaction_id=txn_data["transaction_id"],
                    merchant_raw=txn_data["merchant_raw"],
                    merchant_name=txn_data["merchant_name"],
                    category=txn_data["category"],
                    amount=txn_data["amount"],
                    cloud_region=txn_data["cloud_region"],
                    latency_ms=txn_data["latency_ms"],
                    status=txn_data["status"],
                    error_code=txn_data["error_code"],
                    has_pii_risk=txn_data["has_pii_risk"],
                    timestamp=datetime.fromisoformat(txn_data["timestamp"]),
                )
                session.add(txn)
                await session.commit()

            yield f"data: {json.dumps(txn_data)}\n\n"
            await asyncio.sleep(0.7)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Metrics ─────────────────────────────────────────────────────────────────
@app.get("/metrics")
async def get_metrics():
    """Return aggregated metrics from last 100 transactions."""
    async with async_session() as session:
        return await get_aggregated_metrics(session)


# ─── Anomaly Control ─────────────────────────────────────────────────────────
@app.post("/anomaly/trigger", dependencies=[Depends(verify_api_key)])
@limiter.limit("5/minute")
async def trigger_anomaly(request: Request, body: AnomalyRequest):
    """Activate anomaly mode for the simulator."""
    activate_anomaly(body.duration_seconds)
    return {
        "status": "anomaly_active",
        "duration_seconds": body.duration_seconds,
        "message": f"Anomaly mode activated for {body.duration_seconds}s",
    }


@app.post("/anomaly/clear", dependencies=[Depends(verify_api_key)])
async def clear_anomaly_endpoint(request: Request):
    """Immediately clear anomaly mode."""
    clear_anomaly()
    return {"status": "normal", "message": "Anomaly mode cleared"}


# ─── RCA Generation ─────────────────────────────────────────────────────────
@app.post("/rca/generate", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
async def generate_rca_endpoint(request: Request, body: RCARequest):
    """Generate AI-driven RCA for a failed transaction."""
    async with async_session() as session:
        stmt = select(Transaction).where(Transaction.transaction_id == body.transaction_id)
        result = await session.execute(stmt)
        txn = result.scalar_one_or_none()

        if not txn:
            return {"error": f"Transaction {body.transaction_id} not found"}

        if txn.rca_generated and txn.rca_text:
            return {"transaction_id": body.transaction_id, "rca": txn.rca_text}

        # Build dict for RCA generation
        txn_dict = {
            "transaction_id": txn.transaction_id,
            "merchant_name": txn.merchant_name,
            "category": txn.category,
            "error_code": txn.error_code or "UNKNOWN",
            "cloud_region": txn.cloud_region,
            "latency_ms": txn.latency_ms,
            "timestamp": txn.timestamp.isoformat() if txn.timestamp else "",
        }

        rca_text = await generate_rca(txn_dict)

        # Save RCA to DB
        txn.rca_generated = True
        txn.rca_text = rca_text
        await session.commit()

        return {"transaction_id": body.transaction_id, "rca": rca_text}


# ─── Incidents ───────────────────────────────────────────────────────────────
@app.get("/incidents")
async def get_incidents():
    """Return last 20 failed transactions with RCA status."""
    async with async_session() as session:
        stmt = (
            select(Transaction)
            .where(Transaction.status == "fail")
            .order_by(desc(Transaction.id))
            .limit(20)
        )
        result = await session.execute(stmt)
        incidents = result.scalars().all()

        return [
            {
                "transaction_id": t.transaction_id,
                "merchant_name": t.merchant_name,
                "merchant_raw": t.merchant_raw,
                "category": t.category,
                "error_code": t.error_code,
                "cloud_region": t.cloud_region,
                "latency_ms": t.latency_ms,
                "status": t.status,
                "has_pii_risk": t.has_pii_risk,
                "rca_generated": t.rca_generated,
                "rca_text": t.rca_text,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in incidents
        ]


# ─── Security Events ────────────────────────────────────────────────────────
@app.get("/security/events")
async def get_security_events():
    """
    Return transactions with PII risk or suspicious patterns.
    Suspicious = >5 transactions from same region in 10s window.
    """
    async with async_session() as session:
        # PII risk events
        pii_stmt = (
            select(Transaction)
            .where(Transaction.has_pii_risk == True)
            .order_by(desc(Transaction.id))
            .limit(20)
        )
        pii_result = await session.execute(pii_stmt)
        pii_events = pii_result.scalars().all()

        # Suspicious pattern: >5 txns from same region in last 10 seconds
        ten_sec_ago = datetime.utcnow() - timedelta(seconds=10)
        region_stmt = (
            select(Transaction.cloud_region, func.count(Transaction.id).label("count"))
            .where(Transaction.timestamp >= ten_sec_ago)
            .group_by(Transaction.cloud_region)
            .having(func.count(Transaction.id) > 5)
        )
        region_result = await session.execute(region_stmt)
        suspicious_regions = [row[0] for row in region_result.all()]

        anomaly_events = []
        if suspicious_regions:
            anomaly_stmt = (
                select(Transaction)
                .where(
                    Transaction.cloud_region.in_(suspicious_regions),
                    Transaction.timestamp >= ten_sec_ago,
                )
                .order_by(desc(Transaction.id))
                .limit(10)
            )
            anomaly_result = await session.execute(anomaly_stmt)
            anomaly_events = anomaly_result.scalars().all()

        events = []
        seen_ids = set()

        for t in pii_events:
            if t.transaction_id not in seen_ids:
                seen_ids.add(t.transaction_id)
                events.append({
                    "type": "pii",
                    "transaction_id": t.transaction_id,
                    "merchant_name": t.merchant_name,
                    "cloud_region": t.cloud_region,
                    "message": f"PII data exposure risk detected — ISO 27001 §A.18.1 compliance flag",
                    "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                })

        for t in anomaly_events:
            if t.transaction_id not in seen_ids:
                seen_ids.add(t.transaction_id)
                events.append({
                    "type": "anomaly",
                    "transaction_id": t.transaction_id,
                    "merchant_name": t.merchant_name,
                    "cloud_region": t.cloud_region,
                    "message": f"Suspicious burst pattern from {t.cloud_region} — possible fraud vector",
                    "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                })

        return events


# ─── Root ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    """Root endpoint with Kairos branding."""
    return {
        "name": "Kairos",
        "tagline": "Know the critical moment before it passes.",
        "status": "operational",
    }


# ─── Health Check ────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    """Simple health check with uptime."""
    return {
        "status": "ok",
        "uptime": round(time.time() - _start_time, 1),
        "anomaly_active": is_anomaly_active(),
    }
