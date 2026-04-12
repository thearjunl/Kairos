"""
Gemini AI-driven Root Cause Analysis (RCA) agent for failed transactions.
Uses gemini-1.5-flash with a 10-second timeout.
"""
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are a Level-1 Cloud Support Analyst at Zafin, a fintech SaaS company. Banks rely on Zafin's AI transaction enrichment to process millions of transactions. When a transaction fails, respond with a structured RCA in exactly this format:

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


async def generate_rca(txn: dict) -> str:
    """
    Call Gemini API to generate an RCA for a failed transaction.
    Returns the RCA text or a fallback message on failure.
    """
    if not GEMINI_API_KEY:
        return "RCA: AI Agent offline — no API key configured.\nImpact: Manual triage required.\nAction: Configure GEMINI_API_KEY in .env file."

    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        user_msg = _build_user_message(txn)

        # Run with 10-second timeout
        response = await asyncio.wait_for(
            asyncio.to_thread(model.generate_content, user_msg),
            timeout=10.0,
        )

        return response.text.strip()

    except asyncio.TimeoutError:
        return "RCA: AI Agent timed out after 10s.\nImpact: RCA generation delayed.\nAction: Retry or escalate to L2 for manual analysis."
    except Exception as e:
        return f"RCA: AI Agent offline. Error: {str(e)[:120]}\nImpact: Manual triage required.\nAction: Check Gemini API connectivity and key validity."
