from datetime import datetime, timezone


def utcnow() -> datetime:
    "Returns tz-aware UTC now"
    return datetime.now(timezone.utc)
