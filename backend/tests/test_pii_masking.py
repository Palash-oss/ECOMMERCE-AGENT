import pytest
from backend.app.security.pii_masker import mask_identifier, sanitize_text, mask_dict_pii

def test_mask_identifier_long_id():
    uuid_str = "00012a2ce6f8dcda20d059ce98491703"
    masked = mask_identifier(uuid_str)
    assert masked == "0001****1703"
    assert len(masked) == 12

def test_mask_identifier_short_id():
    short_str = "1234"
    masked = mask_identifier(short_str)
    assert masked == "12**34"

def test_sanitize_text_emails_and_phones():
    sample = "Contact customer at john.doe@example.com or call +55 11 98765-4321 for delivery."
    sanitized = sanitize_text(sample)
    assert "john.doe@example.com" not in sanitized
    assert "[EMAIL_REDACTED]" in sanitized
    assert "[PHONE_REDACTED]" in sanitized

def test_mask_dict_pii_recursive():
    payload = {
        "customer_id": "00012a2ce6f8dcda20d059ce98491703",
        "nested": {
            "comment_message": "Email me at support@store.com thanks",
            "zip_code_prefix": "06273",
            "metric": 120.5
        }
    }
    cleaned = mask_dict_pii(payload)
    assert cleaned["customer_id"] == "0001****1703"
    assert cleaned["nested"]["zip_code_prefix"] == "06**73"
    assert "[EMAIL_REDACTED]" in cleaned["nested"]["comment_message"]
    assert cleaned["nested"]["metric"] == 120.5
