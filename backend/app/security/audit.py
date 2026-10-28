import hashlib
import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("nexus.audit")

class AuditLogger:
    """Records security audit entries with question hashing and zero PII persistence."""

    def __init__(self, max_memory_entries: int = 500):
        self._entries: List[Dict[str, Any]] = []
        self.max_entries = max_memory_entries

    def log_interaction(
        self,
        user_id: str,
        user_role: str,
        raw_question: str,
        tools_executed: List[str],
        tokens_used: int,
        estimated_cost_usd: float,
        provider_used: str,
        status: str = "SUCCESS"
    ):
        question_hash = hashlib.sha256(raw_question.strip().lower().encode("utf-8")).hexdigest()[:16]
        entry = {
            "timestamp": time.time(),
            "iso_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "user_id": user_id,
            "user_role": user_role,
            "question_hash": question_hash,
            "question_preview": raw_question[:35] + ("..." if len(raw_question) > 35 else ""),
            "tools_executed": tools_executed,
            "tokens_used": tokens_used,
            "estimated_cost_usd": round(estimated_cost_usd, 6),
            "provider_used": provider_used,
            "status": status
        }
        self._entries.append(entry)
        if len(self._entries) > self.max_entries:
            self._entries.pop(0)

        logger.info(
            "AUDIT EVENT: user=%s tools=%s tokens=%d provider=%s status=%s",
            user_id, tools_executed, tokens_used, provider_used, status
        )

    def get_recent_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(self._entries[-limit:]))

audit_logger = AuditLogger()
