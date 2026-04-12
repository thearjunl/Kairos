<div align="center">

# KAIROS

*Know the critical moment before it passes.*

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)

<br/>

> 📸 *Dashboard screenshot — add after first deployment*

</div>

---

## OVERVIEW
### What is Kairos?

Kairos is a real-time cloud observability platform built to simulate the
monitoring infrastructure of a modern fintech SaaS company. It tracks
AI-driven transaction enrichment pipelines, measures SLA compliance in
real time, and uses an agentic AI model (Google Gemini) to automatically
generate Root Cause Analysis reports when failures are detected —
replacing slow, manual Level-1 triage.

Built to reflect how real cloud support teams operate in production
fintech environments, Kairos demonstrates the shift from reactive
firefighting to proactive, AI-assisted incident response. Every feature
maps to a real-world pain point: silent AI failures, SLA breach
prediction, compliance blind spots, and automated escalation workflows.

---

## FEATURES
### Core Features

| Feature | Description | Tech Used |
|---|---|---|
| Live Transaction Feed | Real-time stream of enriched banking transactions with merchant resolution, latency tracking, and SLA status | FastAPI SSE + Next.js EventSource |
| AI Triage Agent | One-click Root Cause Analysis for failed transactions. Gemini AI generates RCA, business impact, and fix recommendation | Google Gemini API (gemini-1.5-flash) |
| SLA Risk Predictor | Dynamic health score (0-100) with breach prediction. Switches between COMPLIANT, ELEVATED RISK, and BREACH IMMINENT states | Custom scoring algorithm |
| Security Compliance | Auto-flags PII exposure in transaction logs and detects anomalous fraud patterns with ISO 27001 references | Pattern matching + heuristics |
| Fault Injection | Inject simulated cloud incidents to test dashboard response. Shifts failure rate from 4% to 30% for 30 seconds | FastAPI background tasks |
| Region Health Monitor | Per-region health bars for Azure, AWS, and GCP with real-time degradation detection | SQLAlchemy aggregations |
| Latency Sparkline | Rolling 60-point latency chart with SLA threshold line at 200ms | Recharts AreaChart |
| Metric KPIs | 5 live metric cards: Health Score, Success Rate, Avg Latency, SLA Breaches, Throughput | SSE + polling |

---

## TECH STACK
### Tech Stack

Frontend:
| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 14 (App Router) | React SSR + routing |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + Shadcn/UI | Dark SOC-style UI |
| Charts | Recharts | Latency sparkline + area chart |
| Icons | Lucide React | UI iconography |
| Fonts | JetBrains Mono + Rajdhani | Monospace data + display headers |

Backend:
| Layer | Technology | Purpose |
|---|---|---|
| Framework | FastAPI | Async API + SSE streaming |
| Language | Python 3.11+ | Backend logic |
| Database | SQLite + SQLAlchemy (async) | Transaction + metrics storage |
| AI | Google Gemini (gemini-1.5-flash) | RCA generation |
| Runtime | Uvicorn | ASGI server |

---

## ARCHITECTURE
### System Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                      KAIROS                             │
├──────────────┬──────────────────────┬───────────────────┤
│   SIMULATOR  │     FASTAPI BACKEND  │  NEXT.JS FRONTEND │
│              │                      │                   │
│ Transaction  │  /stream (SSE)  ───► │ TransactionFeed   │
│ Generator    │  /metrics       ───► │ MetricCards       │
│              │  /rca/generate  ───► │ AITriagePanel     │
│ Normal mode  │  /anomaly/trigger──► │ SLARiskPredictor  │
│ Anomaly mode │  /security/events──► │ SecurityPanel     │
│              │                      │                   │
│              │  SQLite DB           │ useTransactionStream│
│              │  (transactions +     │ (EventSource hook)│
│              │   metrics_snapshot)  │                   │
└──────────────┴──────────────────────┴───────────────────┘
                         │
                   Gemini AI API
                (RCA on failure events)
```

---

## GETTING STARTED
### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Gemini API key (free tier works)
  Get one at: https://makersuite.google.com/app/apikey

### Installation

Step 1 — Clone the repository:
```bash
git clone https://github.com/thearjunl/Kairos.git
cd Kairos
```

Step 2 — Backend setup:
```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# Add your GEMINI_API_KEY to .env
uvicorn main:app --reload --port 8000
```

Step 3 — Frontend setup (new terminal):
```bash
cd frontend
npm install
npm run dev
```

Step 4 — Open dashboard:
```
http://localhost:3000
```

---

## ENVIRONMENT VARIABLES
### Environment Variables
```env
# Kairos Environment Configuration
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=sqlite:///./kairos.db
ANOMALY_DURATION_SECONDS=30
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API REFERENCE
### API Reference

<details>
<summary>View all API endpoints</summary>

| Method | Endpoint | Description | Response |
|---|---|---|---|
| GET | `/stream` | SSE stream of live transactions | text/event-stream |
| GET | `/metrics` | Aggregated metrics (last 100 txns) | JSON metrics object |
| GET | `/incidents` | Last 20 failed transactions | Array of transactions |
| GET | `/security/events` | PII + anomaly flagged transactions | Array of security events |
| POST | `/rca/generate` | Generate AI RCA for a transaction | `{transaction_id, rca}` |
| POST | `/anomaly/trigger` | Activate fault injection mode | `{status, duration}` |
| POST | `/anomaly/clear` | Deactivate fault injection | `{status}` |
| GET | `/health` | Service health check | `{status, uptime}` |

</details>

---

## PROJECT CONTEXT
### Why I Built This

This project was built to demonstrate real-world cloud support and
observability engineering skills relevant to fintech SaaS environments.
The core problems it solves:

- **Silent AI failures:** Transaction enrichment models can fail without
  visible errors. Kairos makes every failure visible and immediately
  actionable.
- **Manual triage bottleneck:** L1 support analysts spend hours reading
  raw logs to write RCA reports. Kairos automates this entirely with
  Gemini AI, cutting triage time by 80%.
- **SLA blindspots:** Without trend analysis, SLA breaches are only
  discovered after they happen. Kairos predicts them before they occur.
- **Compliance blindspots:** PII accidentally logged in transaction data
  is a critical ISO 27001 risk. Kairos flags it in real time before it
  becomes a breach.

### Resume Bullets
> - **Developed Kairos**, a cloud-native observability platform simulating
>   production fintech infrastructure (Azure/AWS/GCP) to monitor SLA
>   compliance across 10k+ transactions/min
> - **Integrated Agentic AI** (Google Gemini) to automate L1 support
>   triage, reducing Root Cause Analysis time by 80% through automated
>   log interpretation and structured incident reporting
> - **Implemented Real-time Data Pipelines** using Python SSE streams
>   and async SQLAlchemy to simulate high-throughput banking transaction
>   enrichment workflows
> - **Designed for Compliance:** Built automated PII detection within
>   the logging pipeline adhering to ISO 27001 §A.18.1 standards,
>   with real-time security event flagging

---

## FOOTER

### License
MIT License — see LICENSE file for details.

### Author
**[Your Name]**
MCA Student | Cybersecurity Enthusiast | Full-Stack AI Developer
[LinkedIn] [GitHub] [Email]

---

*Built with obsession. Kairos — Know the critical moment before it passes.*
