from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from backend.app.agent.engine import run_agent_turn_stream, generate_executive_summary, SUGGESTED_QUESTIONS
from backend.app.agent.providers import get_active_llm_provider
from backend.app.security.auth import get_current_user
from backend.app.security.rate_limiter import rate_limiter, token_budget_tracker

router = APIRouter(prefix="/api/v1/agent", tags=["AI Agent"])

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000, description="User question or analysis request")

@router.post("/chat")
def chat_endpoint(
    payload: ChatRequest,
    request: Request,
    user: dict = Depends(get_current_user)
):
    # Enforce token-bucket rate limiter per IP/user
    rate_limiter.enforce(request.client.host if request.client else user["id"])

    return StreamingResponse(
        run_agent_turn_stream(
            user_question=payload.message,
            user_id=user["id"],
            user_role=user.get("role", "viewer")
        ),
        media_type="text/event-stream"
    )

@router.get("/usage")
def get_usage_endpoint(
    request: Request,
    user: dict = Depends(get_current_user)
):
    """Returns real-time usage metrics for the AI Quick Box."""
    _, provider_name = get_active_llm_provider()
    stats = token_budget_tracker.get_user_usage(user["id"])
    stats["provider_in_use"] = provider_name
    return stats

@router.get("/summary")
def get_summary_endpoint(user: dict = Depends(get_current_user)):
    return generate_executive_summary()

@router.get("/suggestions")
def get_suggestions_endpoint():
    return {"suggestions": SUGGESTED_QUESTIONS}
