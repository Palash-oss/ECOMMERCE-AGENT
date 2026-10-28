from typing import Optional
from fastapi import APIRouter, Query, Depends, Request
from backend.app.services.kpi_service import get_kpi_metrics
from backend.app.services.analytics_service import get_timeseries_data, get_categories_breakdown, get_geographic_distribution
from backend.app.security.auth import get_current_user
from backend.app.security.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/v1/overview", tags=["Overview"])

@router.get("/kpis")
def get_kpis_endpoint(
    request: Request,
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return get_kpi_metrics(start_date, end_date, user_id=user["id"])

@router.get("/timeseries")
def get_timeseries_endpoint(
    request: Request,
    granularity: str = Query("month", pattern="^(month|week)$"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return get_timeseries_data(granularity, start_date, end_date, user_id=user["id"])

@router.get("/categories")
def get_categories_endpoint(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return get_categories_breakdown(limit, user_id=user["id"])

@router.get("/geo")
def get_geo_endpoint(
    request: Request,
    limit: int = Query(10, ge=1, le=27),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return get_geographic_distribution(limit, user_id=user["id"])
