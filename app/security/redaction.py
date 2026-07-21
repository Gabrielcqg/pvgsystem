from __future__ import annotations

import re
import uuid
from collections.abc import Mapping
from datetime import date, datetime
from decimal import Decimal
from typing import Any


SECRET_KEY_RE = re.compile(r"(senha|password|token|secret|key)", re.IGNORECASE)
VAULT_REF_RE = re.compile(r"vault:[0-9a-f-]{36}", re.IGNORECASE)


def redact_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            key: "[REDACTED]" if SECRET_KEY_RE.search(str(key)) else redact_value(val)
            for key, val in value.items()
        }
    if isinstance(value, list):
        return [redact_value(item) for item in value]
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, str):
        return VAULT_REF_RE.sub("[VAULT_REF]", value)
    return value


def contains_secret(text: str, secret: str) -> bool:
    return bool(secret) and secret in text
