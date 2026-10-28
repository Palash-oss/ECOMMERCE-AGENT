import time
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from backend.app.services.pdf_service import build_server_side_pdf_report
from backend.app.security.auth import get_current_user
from backend.app.security.rate_limiter import rate_limiter

router = APIRouter(prefix="/api/v1/report", tags=["Reports"])

class ReportRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = "delivered"

@router.post("/pdf")
def generate_pdf_report_endpoint(
    payload: ReportRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    # Amendment 6: Key rate limiting by authenticated user ID
    rate_limiter.enforce(user["id"], cost=2.0)
    pdf_buffer = build_server_side_pdf_report(
        start_date=payload.start_date,
        end_date=payload.end_date,
        user_role=user.get("role", "viewer")
    )
    filename = f"NexusCommerce_Executive_Dossier_{int(time.time())}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
