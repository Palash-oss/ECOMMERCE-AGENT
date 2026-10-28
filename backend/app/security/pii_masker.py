import re
from typing import Any, Dict, List, Union

EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}\b')
CPF_REGEX = re.compile(r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b')

def mask_identifier(val: str) -> str:
    """Masks a UUID, customer ID, or postal prefix while preserving analytical utility."""
    if not val or not isinstance(val, str):
        return val
    if len(val) > 8:
        return f"{val[:4]}****{val[-4:]}"
    elif len(val) >= 4:
        return f"{val[:2]}**{val[-2:]}"
    return "****"

def sanitize_text(text: str) -> str:
    """Masks emails, phone numbers, and Brazilian CPFs from raw user or database text."""
    if not text or not isinstance(text, str):
        return text
    text = EMAIL_REGEX.sub("[EMAIL_REDACTED]", text)
    text = PHONE_REGEX.sub("[PHONE_REDACTED]", text)
    text = CPF_REGEX.sub("[CPF_REDACTED]", text)
    return text

def mask_dict_pii(data: Union[Dict[str, Any], List[Any], Any]) -> Any:
    """Recursively traverses dictionaries or lists and sanitizes PII fields."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            key_lower = k.lower()
            if any(id_field in key_lower for id_field in ["customer_id", "customer_unique_id", "zip_code_prefix"]):
                sanitized[k] = mask_identifier(str(v)) if v else v
            elif any(txt_field in key_lower for txt_field in ["comment", "message", "title", "feedback"]):
                sanitized[k] = sanitize_text(str(v)) if v else v
            else:
                sanitized[k] = mask_dict_pii(v)
        return sanitized
    elif isinstance(data, list):
        return [mask_dict_pii(item) for item in data]
    return data
