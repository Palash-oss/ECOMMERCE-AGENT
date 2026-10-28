import time
from typing import Dict, Tuple, Any
from threading import Lock
from fastapi import HTTPException, status
from backend.app.config import settings

class TokenBucketRateLimiter:
    """Thread-safe in-memory token bucket rate limiter with Retry-After calculation."""

    def __init__(self, rate_per_minute: int = 20):
        self.capacity = rate_per_minute
        self.refill_rate = rate_per_minute / 60.0  # tokens per second
        self._buckets: Dict[str, Tuple[float, float]] = {}  # key -> (tokens, last_refill)
        self._lock = Lock()

    def check(self, key: str, cost: float = 1.0) -> Tuple[bool, int]:
        now = time.time()
        with self._lock:
            if key not in self._buckets:
                self._buckets[key] = (self.capacity, now)

            tokens, last_refill = self._buckets[key]
            elapsed = now - last_refill
            tokens = min(self.capacity, tokens + elapsed * self.refill_rate)

            if tokens >= cost:
                tokens -= cost
                self._buckets[key] = (tokens, now)
                return True, 0
            else:
                deficit = cost - tokens
                retry_after = int(deficit / self.refill_rate) + 1
                self._buckets[key] = (tokens, now)
                return False, retry_after

    def enforce(self, key: str, cost: float = 1.0):
        allowed, retry_after = self.check(key, cost)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please retry after {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

rate_limiter = TokenBucketRateLimiter(rate_per_minute=settings.RATE_LIMIT_PER_MINUTE)

class TokenBudgetTracker:
    """Tracks daily tokens used per user and global estimated monthly spend."""

    def __init__(self, daily_budget: int = 250000, monthly_spend_cap: float = 50.00):
        self.daily_budget = daily_budget
        self.monthly_spend_cap = monthly_spend_cap
        self._user_daily_tokens: Dict[str, int] = {}
        self._user_daily_requests: Dict[str, int] = {}
        self.total_tokens_today = 0
        self.total_tokens_month = 0
        self._lock = Lock()

    def record_usage(self, user_id: str, prompt_tokens: int, completion_tokens: int):
        total = prompt_tokens + completion_tokens
        with self._lock:
            self._user_daily_tokens[user_id] = self._user_daily_tokens.get(user_id, 0) + total
            self._user_daily_requests[user_id] = self._user_daily_requests.get(user_id, 0) + 1
            self.total_tokens_today += total
            self.total_tokens_month += total

    def get_user_usage(self, user_id: str) -> Dict[str, Any]:
        with self._lock:
            used_tokens = self._user_daily_tokens.get(user_id, 0)
            req_count = self._user_daily_requests.get(user_id, 0)
            # Estimate blended cost (~$0.15 per 1M tokens for Gemini Flash / Llama-70B)
            cost_today = (used_tokens / 1_000_000.0) * 0.15
            cost_month = (self.total_tokens_month / 1_000_000.0) * 0.15
            pct_used = min(100.0, (used_tokens / self.daily_budget) * 100.0) if self.daily_budget > 0 else 0.0

            return {
                "user_id": user_id,
                "requests_today": req_count,
                "tokens_used_today": used_tokens,
                "daily_budget_tokens": self.daily_budget,
                "budget_used_pct": round(pct_used, 1),
                "estimated_cost_today_usd": round(cost_today, 4),
                "estimated_cost_month_usd": round(cost_month, 4),
                "monthly_spend_cap_usd": self.monthly_spend_cap,
                "rate_limit_per_minute": settings.RATE_LIMIT_PER_MINUTE
            }

token_budget_tracker = TokenBudgetTracker(
    daily_budget=settings.DAILY_TOKEN_BUDGET,
    monthly_spend_cap=settings.MONTHLY_SPEND_CAP_USD
)
