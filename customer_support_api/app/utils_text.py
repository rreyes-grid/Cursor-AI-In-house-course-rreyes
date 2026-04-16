import re

import bleach


def sanitize_user_text(text: str, max_length: int | None = None) -> str:
    """Strip HTML and limit length for XSS prevention (NFR-009, NFR-016)."""
    if text is None:
        return ""
    cleaned = bleach.clean(text, tags=[], strip=True)
    if max_length is not None:
        cleaned = cleaned[:max_length]
    return cleaned.strip()


_SUBJECT_PATTERN = re.compile(r"^[\w\s\-.,!?\'\"():;/&@#%+*=\[\]{}]+$", re.UNICODE)


def validate_subject_pattern(subject: str) -> bool:
    """Alphanumeric and common punctuation only (FR-001)."""
    if not subject or len(subject) < 5:
        return False
    return bool(_SUBJECT_PATTERN.match(subject))
