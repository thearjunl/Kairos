"""
Gemini AI-driven Root Cause Analysis (RCA) agent for failed transactions.
Uses gemini-1.5-flash with retry logic and 10-second timeout.
"""
import os
import asyncio
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are a Level-1 Cloud Support Analyst at a fintech SaaS company. Banks rely on your company's AI transaction enrichment to process millions of transactions. When a transaction fails, respond with a structured RCA in exactly this format:

RCA: [1 sentence root cause, be specific about the component that failed]
Impact: [1 sentence on business/SLA impact for the bank]
Action: [1 sentence immediate remediation step]

Be technical, concise, and actionable. Reference the specific error type and region."""


def _build_user_message(txn: dict) -> str:
    return (
        f"Transaction {txn['transaction_id']} FAILED.\n"
        f"Merchant: {txn['merchant_name']} ({txn['category']})\n"
        f"Error: {txn['error_code']}\n"
        f"Region: {txn['cloud_region']}\n"
        f"Latency: {txn['latency_ms']}ms (SLA threshold: 200ms)\n"
        f"Timestamp: {txn['timestamp']}"
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
)
async def _call_gemini_with_retry(user_msg: str) -> str:
    """Call Gemini API with exponential backoff retry (3 attempts max)."""
    import google.generativeai as genai

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    response = await asyncio.wait_for(
        asyncio.to_thread(model.generate_content, user_msg),
        timeout=10.0,
    )
    return response.text.strip()


async def generate_rca(txn: dict) -> str:
    """
    Call Gemini API to generate an RCA for a failed transaction.
    Returns the RCA text or a fallback message on failure.
    """
    if not GEMINI_API_KEY:
        return "RCA: AI Agent offline — no API key configured.\nImpact: Manual triage required.\nAction: Configure GEMINI_API_KEY in .env file."

    try:
        user_msg = _build_user_message(txn)
        return await _call_gemini_with_retry(user_msg)

    except asyncio.TimeoutError:
        return "RCA: AI Agent timed out after 10s.\nImpact: RCA generation delayed.\nAction: Retry or escalate to L2 for manual analysis."
    except Exception as e:
        return f"RCA: AI Agent offline. Error: {str(e)[:120]}\nImpact: Manual triage required.\nAction: Check Gemini API connectivity and key validity."
