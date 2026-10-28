from typing import Dict, Any, Optional
from backend.app.cache import cache
from backend.app.services.metrics_service import (
    query_canonical_kpis, DEFAULT_START_DATE, DEFAULT_END_DATE
)

def get_kpi_metrics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: str = "delivered",
    user_id: str = "anon"
) -> Dict[str, Any]:
    """
    Returns verified macro KPI metrics.
    Defaults to the last 6 complete months in the dataset (2018-03-01 to 2018-08-31)
    with genuine historical preceding window deltas (or None if prior data lacks full coverage).
    """
    effective_start = start_date if start_date is not None else DEFAULT_START_DATE
    effective_end = end_date if end_date is not None else DEFAULT_END_DATE

    cache_key = cache._generate_key("kpi_metrics_v2", user_id, {
        "start": effective_start,
        "end": effective_end,
        "status": status_filter
    })
    cached = cache.get(cache_key)
    if cached:
        return cached

    result = query_canonical_kpis(
        start_date=effective_start,
        end_date=effective_end,
        status_filter=status_filter
    )

    cache.set(cache_key, result, ttl=120)
    return result
