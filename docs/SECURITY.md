# System Security Specification & Threat Model

**Status**: Active  
**Enforcement Level**: Mandatory / Non-Negotiable  

---

## 1. Threat Model & Mitigation Matrix

| Threat Category | Potential Vector | Mitigation Strategy | Implementation File / Mechanism |
| :--- | :--- | :--- | :--- |
| **Unauthorized DB Modification** | Accidental or malicious `INSERT/UPDATE/DELETE/DROP` queries | Session-level enforcement `SET default_transaction_read_only = on;`. No DDL/DML written. Read-only role proposed in SQL. | `backend/database.py`, `db/proposed_changes.sql` |
| **SQL Injection** | Parameter manipulation in filters or search bars | 100% parameterized queries via `psycopg2` / `asyncpg` parameter placeholders (`%s` / `$1`). Zero string formatting. | `backend/services/*.py` |
| **Credential & Secret Leakage** | Committing `.env` or logging connection strings | `.env` strictly git-ignored. Startup validator masks all secrets. Logs never print credentials or tokens. | `.gitignore`, `backend/config.py` |
| **Prompt Injection** | Untrusted database records (e.g. malicious product names or reviews) attempting to hijack AI instructions | System prompt declares DB data as untrusted data wrapped in `<untrusted_data>` delimiters. Agent has zero write/execute tools. | `backend/agent/prompts.py`, `backend/agent/engine.py` |
| **PII Data Exfiltration** | AI model or PDF output leaking customer identities or addresses | PII masking layer automatically sanitizes customer IDs, ZIP codes, and review text before model ingestion. | `backend/security/pii_masker.py` |
| **API Denial of Service / Spend Attack** | High-frequency query spam draining LLM token budget | Token bucket rate limiting (20 req/min per IP/user), daily token budgets, and spend caps. | `backend/security/rate_limiter.py` |
| **Cross-Site Scripting (XSS)** | Malicious HTML in product reviews or AI markdown responses | Markdown rendered through sanitized parser; `dangerouslySetInnerHTML` forbidden. Strict Content-Security-Policy. | Frontend components, `index.html` |
| **Broken Authentication** | Token theft or session hijacking | HTTP-only, Secure, SameSite cookies for JWT tokens. Short-lived access tokens (30 min) + rotating refresh tokens. | `backend/security/auth.py` |

---

## 2. Pre-Deployment Security Checklist

- [x] `.env` is covered in `.gitignore`.
- [x] Connection string contains `sslmode=verify-full` with verified CA root certificate.
- [x] Session read-only is enforced on every database connection (`SET default_transaction_read_only = on`).
- [x] Statement timeout is set to 5000ms (`SET statement_timeout = 5000`).
- [x] No raw SQL execution permitted for the AI Agent (strictly typed tools only).
- [x] PII masking is applied before sending database data to external LLM APIs.
- [x] Rate limiting is enabled on all `/api/v1/...` endpoints.
