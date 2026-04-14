"""
Kairos ChatOps — Conversational AI interface for live system interrogation.
Users can ask natural-language questions about the system state, and Gemini
responds with data-backed answers derived from real transaction history.
"""
import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential

from models import Transaction

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

CHATOPS_SYSTEM_PROMPT = """You are Kairos AI — a real-time cloud observability assistant for a fintech SaaS company.
You have access to live system telemetry data provided below. Use ONLY this data to answer the user's question.

Rules:
- Be concise, technical, and actionable.
- Reference specific metrics, regions, error codes, and timestamps from the data.
- If the data doesn't contain enough information to answer, say so.
- Format responses with clear sections using markdown-style formatting.
- Use monospace for numbers, IDs, and technical terms.
- Keep responses under 200 words.

You are an expert in cloud infrastructure, fintech SLA management, and incident response."""


async def _build_system_context(session: AsyncSession) -> dict:
    """Build a rich context object from recent transaction data."""
    # Last 100 transactions
    stmt = select(Transaction).order_by(desc(Transaction.id)).limit(100)
    result = await session.execute(stmt)
    transactions = result.scalars().all()

    if not transactions:
        return {"summary": "No transaction data available yet.", "details": {}}

    total = len(transactions)
    success_count = sum(1 for t in transactions if t.status == "success")
    fail_count = sum(1 for t in transactions if t.status == "fail")
    degraded_count = sum(1 for t in transactions if t.status == "degraded")
    avg_latency = sum(t.latency_ms for t in transactions) / total
    sla_breaches = sum(1 for t in transactions if t.latency_ms >= 200)

    # Per-region breakdown
    region_data = {}
    for t in transactions:
        if t.cloud_region not in region_data:
            region_data[t.cloud_region] = {"total": 0, "fail": 0, "latency_sum": 0}
        region_data[t.cloud_region]["total"] += 1
        if t.status == "fail":
            region_data[t.cloud_region]["fail"] += 1
        region_data[t.cloud_region]["latency_sum"] += t.latency_ms

    region_summary = {}
    for region, data in region_data.items():
        region_summary[region] = {
            "total_txns": data["total"],
            "failure_rate": round((data["fail"] / data["total"]) * 100, 1) if data["total"] else 0,
            "avg_latency_ms": round(data["latency_sum"] / data["total"], 1) if data["total"] else 0,
        }

    # Error code distribution
    error_codes = {}
    for t in transactions:
        if t.error_code:
            error_codes[t.error_code] = error_codes.get(t.error_code, 0) + 1

    # Recent failures (last 10)
    recent_failures = [
        {
            "id": t.transaction_id,
            "merchant": t.merchant_name,
            "error": t.error_code,
            "region": t.cloud_region,
            "latency_ms": t.latency_ms,
            "time": t.timestamp.isoformat() if t.timestamp else "unknown",
        }
        for t in transactions
        if t.status == "fail"
    ][:10]

    # Top merchants by failure count
    merchant_failures = {}
    for t in transactions:
        if t.status == "fail":
            merchant_failures[t.merchant_name] = merchant_failures.get(t.merchant_name, 0) + 1

    return {
        "overview": {
            "total_transactions_analyzed": total,
            "success_rate": round((success_count / total) * 100, 1),
            "failure_rate": round((fail_count / total) * 100, 1),
            "degraded_rate": round((degraded_count / total) * 100, 1),
            "avg_latency_ms": round(avg_latency, 1),
            "sla_breaches_count": sla_breaches,
            "sla_breach_rate": round((sla_breaches / total) * 100, 1),
        },
        "region_breakdown": region_summary,
        "error_distribution": error_codes,
        "recent_failures": recent_failures,
        "merchant_failure_counts": merchant_failures,
        "data_window": f"Last {total} transactions",
    }


def _build_prompt(question: str, context: dict) -> str:
    """Build the user message with embedded context data."""
    import json
    context_str = json.dumps(context, indent=2)
    return (
        f"=== LIVE SYSTEM TELEMETRY ===\n"
        f"{context_str}\n\n"
        f"=== USER QUESTION ===\n"
        f"{question}"
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
async def _call_gemini(prompt: str) -> str:
    """Call Gemini API with the ChatOps prompt."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=CHATOPS_SYSTEM_PROMPT,
    )

    response = await asyncio.wait_for(
        asyncio.to_thread(model.generate_content, prompt),
        timeout=15.0,
    )
    return response.text.strip()


async def chat_with_kairos(question: str, session: AsyncSession) -> dict:
    """
    Process a user question against live system data using Gemini AI.
    Returns the AI response and the context data used.
    """
    if not GEMINI_API_KEY:
        return {
            "response": "⚠ Kairos AI is offline — no GEMINI_API_KEY configured.\nConfigure it in your .env file to enable ChatOps.",
            "context_used": {},
        }

    try:
        context = await _build_system_context(session)
        prompt = _build_prompt(question, context)
        response = await _call_gemini(prompt)

        return {
            "response": response,
            "context_used": context.get("overview", {}),
        }

    except asyncio.TimeoutError:
        return {
            "response": "⚠ Kairos AI timed out (15s). The system is under load. Try again.",
            "context_used": {},
        }
    except Exception as e:
        return {
            "response": f"⚠ Kairos AI error: {str(e)[:150]}",
            "context_used": {},
        }
