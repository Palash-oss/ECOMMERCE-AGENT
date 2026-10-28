from typing import Optional
from fastapi import APIRouter, Query, Depends, Request
from backend.app.services.order_service import list_orders
from backend.app.security.auth import get_current_user
from backend.app.security.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

@router.get("")
def list_orders_endpoint(
    request: Request,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    rate_limiter.enforce(request.client.host if request.client else user["id"])
    return list_orders(status=status, page=page, page_size=page_size)
