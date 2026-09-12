from __future__ import annotations

import re
from urllib.parse import urlparse


X_HOSTS = {
    "x.com", "www.x.com", "mobile.x.com",
    "twitter.com", "www.twitter.com", "mobile.twitter.com", "m.twitter.com",
}
_STATUS_PATH_RE = re.compile(
    r"^/(?:[A-Za-z0-9_]+|i/web)/status/(?P<id>[1-9]\d*)"
    r"(?:/video/(?P<index>[1-9]\d*))?/?$"
)


def x_status_parts(url: str) -> tuple[str, str] | None:
    try:
        parsed = urlparse(url)
        if (
            parsed.scheme.lower() not in {"http", "https"}
            or (parsed.hostname or "").lower().rstrip(".") not in X_HOSTS
            or parsed.username is not None
            or parsed.password is not None
            or parsed.port is not None
        ):
            return None
    except ValueError:
        return None
    match = _STATUS_PATH_RE.fullmatch(parsed.path)
    if not match:
        return None
    return match.group("id"), match.group("index") or ""


def is_x_video_url(url: str) -> bool:
    return x_status_parts(url) is not None


def canonical_x_video_url(url: str) -> str:
    parts = x_status_parts(url)
    if parts is None:
        raise ValueError(f"Invalid X/Twitter status URL: {url}")
    status_id, index = parts
    suffix = f"/video/{index}" if index else ""
    return f"https://x.com/i/status/{status_id}{suffix}"
