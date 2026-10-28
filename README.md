# NexusCommerce AI | Enterprise E-Commerce Analytics Platform & AI Assistant Agent

A production-grade, full-stack E-Commerce Analytics Dashboard and Embedded Autonomous AI Assistant Agent built on top of a live **CockroachDB Enterprise Cluster** (Brazilian E-Commerce Olist Dataset).

---

## 1. System Architecture & Tech Stack

- **Backend**: FastAPI (Python 3.14), `ThreadedConnectionPool` with strict read-only session (`SET default_transaction_read_only = on`) and 5s statement timeouts (`SET statement_timeout = 5000`), CockroachDB transaction retry handler (`SQLSTATE 40001`), Pydantic v2 schemas, multi-level in-process TTL caching (swappable to Redis), and ReportLab server-side PDF generator.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, and Fontsource Plus Jakarta Sans.
- **AI Agent**: Provider-agnostic abstraction (`GeminiProvider`, `GroqProvider`, and `DeterministicLocalProvider`) with automatic fallback, exponential backoff, and jitter. **10 typed, parameterized tools with strict Pydantic validation and zero raw SQL execution.**
- **Security**: JWT cookie authentication, role-based access control, token-bucket rate limiter (20 req/min), daily token budget, PII masking layer (customer IDs, ZIP codes, CPF, reviews), and strict security headers.

---

## 2. Quick Start & Execution

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `DATABASE_URL` and `DATABASE_SSLROOTCERT` point to your CockroachDB cluster and root certificate.

### 2. Run the Backend API Server
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 3. Run the Frontend Bento Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open your browser to: `http://localhost:5173/`

### 4. Run the Quality Test Suite
```bash
python -m pytest backend/tests/ -v
```

---

## 3. Switching AI Providers

The agent dynamically switches providers based on the `LLM_PROVIDER` environment variable in `.env`:

| `LLM_PROVIDER` Setting | Behavior |
| :--- | :--- |
| `auto` (Default) | Automatically inspects available API keys. Prefers Gemini Flash if `GEMINI_API_KEY` is present; falls back to Groq Llama-3.3-70B if `GROQ_API_KEY` is set; safely uses the deterministic analytical engine if neither key is configured. |
| `gemini` | Exclusively uses Google Gemini 1.5 Flash via REST v1beta. |
| `groq` | Exclusively uses Groq Llama-3.3-70B-Versatile via OpenAI-compatible API. |

---

## 4. Acceptance Check Verification (ADD-ON D)

1. **Zero Destructive SQL Proof**:
   Running a global regex scan across `backend/app/` for `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE` confirms that only `SELECT` queries exist.
2. **Secrets Protection**:
   `.env` is verified git-ignored in `.gitignore`.
3. **Live Product Explorer**:
   Search for any catalog SKU (e.g. `watches`, `health_beauty`, or SKU prefix `bb50f2e2`) via `Ctrl+K` or the Product Explorer tab to inspect live revenue, category rank, frequently bought together bundles, and recent verified reviews in sub-second latency.

---

## 5. Scaling Recommendations

1. **Read Replicas**: For high-concurrency BI reporting, provision read-only followers in CockroachDB.
2. **Redis Distributed Caching**: Toggle `REDIS_ENABLED=true` in `config.py` to move from in-process memory caching to an external Redis cluster.
3. **Asynchronous PDF Worker Queue**: Offload heavy multi-year PDF generation jobs to Celery/ARQ with an S3 pre-signed URL download callback.
