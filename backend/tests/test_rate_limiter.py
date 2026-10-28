import pytest
from backend.app.security.rate_limiter import TokenBucketRateLimiter
from fastapi import HTTPException

def test_rate_limiter_allows_under_capacity():
    limiter = TokenBucketRateLimiter(rate_per_minute=20)
    allowed, retry_after = limiter.check("client_1", cost=1.0)
    assert allowed is True
    assert retry_after == 0

def test_rate_limiter_blocks_when_exhausted():
    limiter = TokenBucketRateLimiter(rate_per_minute=5)
    # Consume all tokens
    for _ in range(5):
        allowed, _ = limiter.check("client_2", cost=1.0)
        assert allowed is True
    
    # Next request must be rejected
    allowed, retry_after = limiter.check("client_2", cost=1.0)
    assert allowed is False
    assert retry_after > 0

def test_rate_limiter_enforce_raises_429():
    limiter = TokenBucketRateLimiter(rate_per_minute=2)
    limiter.enforce("client_3", cost=2.0)
    with pytest.raises(HTTPException) as exc_info:
        limiter.enforce("client_3", cost=1.0)
    assert exc_info.value.status_code == 429
