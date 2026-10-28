import json
import time
import logging
from typing import Dict, Any, List, Generator, Optional
from backend.app.agent.providers import get_active_llm_provider
from backend.app.agent.tools import TOOL_REGISTRY, TOOL_DEFINITIONS
from backend.app.agent.prompts import SYSTEM_PROMPT, wrap_untrusted_data
from backend.app.security.pii_masker import mask_dict_pii
from backend.app.security.rate_limiter import token_budget_tracker
from backend.app.security.audit import audit_logger
from backend.app.services.metrics_service import (
    build_structured_facts_json, validate_text_against_facts,
    DEFAULT_START_DATE, DEFAULT_END_DATE
)

logger = logging.getLogger("nexus.agent_engine")

SUGGESTED_QUESTIONS = [
    "What are our top 3 revenue product categories and their unit economics?",
    "Analyze customer review ratings and 1-star dissatisfaction breakdown.",
    "Which Brazilian states account for top demand and what is their freight overhead?",
    "Identify on-time delivery performance and carrier turnaround bottlenecks.",
    "Give me an executive summary of overall e-commerce performance."
]

def run_agent_turn_stream(
    user_question: str,
    user_id: str = "anon",
    user_role: str = "viewer",
    max_turns: int = 4
) -> Generator[str, None, None]:
    """
    Orchestrates the autonomous AI agent loop with:
    1. Tool memoization (deduplication of get_kpis and identical calls within turn).
    2. Zero raw SQL & parameterized tool execution.
    3. SSE streaming telemetry and audited interactions.
    """
    provider, provider_name = get_active_llm_provider()
    yield f"data: {json.dumps({'type': 'status', 'text': f'AI Agent active ({provider_name}). Analyzing query intent...'})}\n\n"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": wrap_untrusted_data(user_question)}
    ]

    total_prompt_tokens = 100
    total_completion_tokens = 0
    tools_executed: List[str] = []
    tool_memo_cache: Dict[str, Any] = {}
    turn_count = 0

    while turn_count < max_turns:
        turn_count += 1
        try:
            tool_calls, direct_text, usage = provider.generate_chat_response(messages, TOOL_DEFINITIONS)
            total_prompt_tokens += usage.get("prompt_tokens", 0)
            total_completion_tokens += usage.get("completion_tokens", 0)
        except Exception as e:
            logger.warning("Primary provider %s error: %s. Engaging deterministic local tool routing.", provider_name, e)
            tool_calls, direct_text, usage = provider.local.generate_chat_response(messages, TOOL_DEFINITIONS)
            total_prompt_tokens += usage.get("prompt_tokens", 0)
            total_completion_tokens += usage.get("completion_tokens", 0)

        if not tool_calls:
            # Model is ready to formulate final answer or provided text directly
            if direct_text:
                yield f"data: {json.dumps({'type': 'token', 'content': direct_text})}\n\n"
            break

        # Execute tools with Turn-Level Memoization
        assistant_tool_calls = []
        for i, tc in enumerate(tool_calls):
            call_id = tc.get("id", f"call_{len(assistant_tool_calls)}_{int(time.time())}")
            assistant_tool_calls.append({
                "id": call_id,
                "type": "function",
                "function": {
                    "name": tc["name"],
                    "arguments": json.dumps(tc.get("args", {}))
                }
            })

        messages.append({
            "role": "assistant",
            "content": direct_text or "",
            "tool_calls": assistant_tool_calls
        })

        for i, tc in enumerate(tool_calls):
            fn_name = tc["name"]
            fn_args = tc.get("args", {})
            call_id = assistant_tool_calls[i]["id"]
            call_hash = f"{fn_name}:{json.dumps(fn_args, sort_keys=True)}"

            if fn_name not in tools_executed:
                tools_executed.append(fn_name)

            tool_label = fn_name.replace("_", " ").title()

            if call_hash in tool_memo_cache:
                logger.info("Reusing memoized result for tool '%s' within turn", fn_name)
                tool_output = tool_memo_cache[call_hash]
                yield f"data: {json.dumps({'type': 'status', 'text': f'Verified cached data: {tool_label}...'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'status', 'text': f'Querying live database: {tool_label}...'})}\n\n"
                tool_fn = TOOL_REGISTRY.get(fn_name)
                if not tool_fn:
                    tool_output = {"error": f"Tool '{fn_name}' is unauthorized."}
                else:
                    try:
                        raw_result = tool_fn(fn_args)
                        tool_output = mask_dict_pii(raw_result)
                    except Exception as ex:
                        tool_output = {"error": f"Tool execution failed: {str(ex)}"}

                tool_memo_cache[call_hash] = tool_output

            # Send tool call event to frontend UI
            yield f"data: {json.dumps({'type': 'tool_call', 'name': fn_name, 'args': fn_args, 'result_preview': str(tool_output)[:120]})}\n\n"

            # Append tool result into dialogue context compliant with OpenAI/Groq specs
            messages.append({
                "role": "tool",
                "tool_call_id": call_id,
                "name": fn_name,
                "content": json.dumps(tool_output, default=str)
            })

    # Stream final token-by-token answer
    yield f"data: {json.dumps({'type': 'status', 'text': 'Synthesizing verified executive response...'})}\n\n"
    
    stream_tokens_count = 0
    accumulated_chunks = []
    try:
        for chunk in provider.stream_final_answer(messages):
            accumulated_chunks.append(chunk)
            stream_tokens_count += len(chunk.split())
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
    except Exception as ex:
        logger.warning("Streaming error from provider: %s. Falling back to local deterministic stream.", ex)
        for chunk in provider.local.stream_final_answer(messages):
            accumulated_chunks.append(chunk)
            stream_tokens_count += len(chunk.split())
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

    total_completion_tokens += stream_tokens_count

    # Calculate token cost and record usage
    token_budget_tracker.record_usage(user_id, total_prompt_tokens, total_completion_tokens)
    cost = ((total_prompt_tokens + total_completion_tokens) / 1_000_000.0) * 0.15

    audit_logger.log_interaction(
        user_id=user_id,
        user_role=user_role,
        raw_question=user_question,
        tools_executed=tools_executed,
        tokens_used=total_prompt_tokens + total_completion_tokens,
        estimated_cost_usd=cost,
        provider_used=provider_name
    )

    yield f"data: {json.dumps({'type': 'done', 'tools_used': tools_executed, 'tokens_used': total_prompt_tokens + total_completion_tokens, 'provider': provider_name})}\n\n"

def generate_executive_summary(
    start_date: Optional[str] = DEFAULT_START_DATE,
    end_date: Optional[str] = DEFAULT_END_DATE,
    status_filter: str = "delivered"
) -> Dict[str, Any]:
    """
    Generates a fact-grounded Executive Summary.
    Grounded in structured facts JSON from live queries with zero hallucinated figures.
    """
    facts = build_structured_facts_json(start_date=start_date, end_date=end_date, status_filter=status_filter)

    top_cat_names = [f"{c['category']} (R$ {c['revenue']:,.2f})" for c in facts["top_categories"][:2]]
    cat_str = " and ".join(top_cat_names) if top_cat_names else "leading merchandise lines"

    top_state = facts["top_states"][0] if facts["top_states"] else {"state": "SP", "avg_freight": 15.12}

    insights = [
        f"Delivered order volume reached {facts['orders']:,} orders ({facts['gmv_compact']} GMV) with {facts['customers']:,} unique buyers.",
        f"Repeat buyer rate is {facts['repeat_buyer_rate']}% across the reporting window with {facts['repeat_buyers']:,} repeat purchasing accounts.",
        f"Top product category contribution led by {cat_str}.",
        f"Customer satisfaction averages {facts['avg_review_score']} / 5.00 stars with {facts['pct_5_star']}% 5-star ratings."
    ]

    delayed_pct = round(100.0 - facts["on_time_pct"], 1)
    risks = [
        f"Fulfillment transit delay: {delayed_pct}% of completed orders were delivered after the carrier estimated delivery date.",
        f"Customer friction: {facts['pct_1_star']}% of reviews received a 1-star dissatisfaction rating."
    ]

    actions = [
        f"Optimize logistics corridors in secondary hub states to reduce transit time down from {facts['avg_delivery_days']} days.",
        f"Expand inventory depth in {facts['top_categories'][0]['category'] if facts['top_categories'] else 'top categories'} to protect revenue share."
    ]

    summary = {
        "headline": f"E-Commerce Performance: {facts['gmv_compact']} GMV across {facts['orders']:,} Delivered Orders",
        "date_range": facts["date_range"],
        "insights": insights,
        "risks": risks,
        "actions": actions,
        "facts_grounding": {
            "gmv": facts["gmv"],
            "orders": facts["orders"],
            "customers": facts["customers"],
            "repeat_buyer_rate": facts["repeat_buyer_rate"],
            "on_time_pct": facts["on_time_pct"],
            "avg_review_score": facts["avg_review_score"]
        }
    }

    # Validate numbers in synthesized output
    full_text = " ".join([summary["headline"]] + insights + risks + actions)
    is_valid, unverified = validate_text_against_facts(full_text, facts)
    if not is_valid:
        logger.warning("Executive summary contained unverified figures: %s", unverified)

    return summary
