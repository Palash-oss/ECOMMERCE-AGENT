from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, Depends, Request
from backend.app.services.product_service import (
    search_products_suggestions, list_products, get_product_details, compare_products_stats
)
from backend.app.security.auth import get_current_user
from backend.app.security.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/v1/products", tags=["Products"])

class CompareRequest(BaseModel):
    product_ids: List[str] = Field(..., min_length=2, max_length=3)

@router.get("/search")
def search_suggestions_endpoint(
    request: Request,
    q: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(10, ge=1, le=15),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return search_products_suggestions(q, limit)

@router.get("")
def list_products_endpoint(
    request: Request,
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: str = Query("revenue", pattern="^(revenue|best_selling|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return list_products(
        search=search,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )

@router.get("/{product_id}")
def get_product_detail_endpoint(
    product_id: str,
    request: Request,
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return get_product_details(product_id)

@router.post("/compare")
def compare_products_endpoint(
    payload: CompareRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return compare_products_stats(payload.product_ids)
