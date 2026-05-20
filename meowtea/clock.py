from datetime import datetime, timedelta, timezone


APP_TIMEZONE = timezone(timedelta(hours=7), "Asia/Bangkok")


def local_now() -> datetime:
    """Return naive local time to match legacy MySQL DATETIME behavior."""
    return datetime.now(APP_TIMEZONE).replace(tzinfo=None)
