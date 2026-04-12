<div align="center">

# KAIROS

*Know the critical moment before it passes.*

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-brightgreen?style=for-the-badge)

<br/>

![Kairos Dashboard](assets/dashboard_screenshot.png)






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
| Database | PostgreSQL + SQLAlchemy (async) | Transaction + metrics storage |
| AI | Google Gemini (gemini-1.5-flash) | RCA generation |
| Runtime | Gunicorn + Uvicorn | Production ASGI server |
| Auth | API Key + Rate Limiting | Endpoint protection |

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
│              │  PostgreSQL DB       │ useTransactionStream│
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
- Docker & Docker Compose (recommended)
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
```

Development:
```bash
uvicorn main:app --reload --port 8000
```

Production:
```bash
bash start.sh
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

## DEPLOYMENT
### Deployment

#### Option A — Docker (Recommended)
```bash
# Build and run all services (PostgreSQL + Backend + Frontend)
docker-compose up --build

# Access dashboard
http://localhost:3000
```

#### Option B — Cloud Deployment (Free Tier)

| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend | Vercel | Yes |
| Backend | Render | Yes |
| Database | Supabase (PostgreSQL) | Yes |

**Frontend (Vercel):**
1. Push repo to GitHub
2. Import project at vercel.com
3. Set root directory to `frontend`
4. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
5. Deploy

**Backend (Render):**
1. Create new Web Service at render.com
2. Connect GitHub repo, set root to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `bash start.sh`
5. Add all `.env` variables in Render dashboard

**Database (Supabase):**
1. Create project at supabase.com
2. Copy the connection string (Session mode, port 5432)
3. Set as `DATABASE_URL` in Render environment variables

---

## ENVIRONMENT VARIABLES
### Environment Variables
```env
# ─── Kairos Environment Configuration ───────────────────

# Environment: development | staging | production
APP_ENV=development

# Database
DATABASE_URL=postgresql+asyncpg://kairos_user:password@localhost:5432/kairos_db

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# CORS (comma-separated, no spaces)
ALLOWED_ORIGINS=http://localhost:3000

# Server
PORT=8000
ANOMALY_DURATION_SECONDS=30

# API Security
API_SECRET_KEY=your_random_secret_key_here
```

---

## API REFERENCE
### API Reference

<details>
<summary>View all API endpoints</summary>

| Method | Endpoint | Description | Auth | Response |
|---|---|---|---|---|
| GET | `/stream` | SSE stream of live transactions | No | text/event-stream |
| GET | `/metrics` | Aggregated metrics (last 100 txns) | No | JSON metrics object |
| GET | `/incidents` | Last 20 failed transactions | No | Array of transactions |
| GET | `/security/events` | PII + anomaly flagged transactions | No | Array of security events |
| POST | `/rca/generate` | Generate AI RCA for a transaction | 🔐 API Key | `{transaction_id, rca}` |
| POST | `/anomaly/trigger` | Activate fault injection mode | 🔐 API Key | `{status, duration}` |
| POST | `/anomaly/clear` | Deactivate fault injection | 🔐 API Key | `{status}` |
| GET | `/health` | Service health check | No | `{status, uptime}` |

Protected endpoints require `X-API-Key` header when `API_SECRET_KEY` is set.

</details>



*Built with obsession. Kairos — Know the critical moment before it passes.*
