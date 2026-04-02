import os
import logging
from fastapi import Request, HTTPException, status
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)
_redis_client = None
_redis_warned = False  # Track if we've already warned about Redis being unavailable
_trust_proxy_headers = os.getenv("TRUST_PROXY_HEADERS", "false").strip().lower() in {"1", "true", "yes", "on"}


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    return _redis_client


def get_request_ip(request: Request) -> str:
    """Return client IP, trusting proxy headers only when explicitly enabled."""
    if _trust_proxy_headers:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def rate_limit(request: Request, limit: int = 60, window: int = 60, fail_open: bool = True):
    """Sliding window rate limiter. Default: 60 requests/minute per IP."""
    client = _get_redis()
    ip = get_request_ip(request)
    key = f"rl:{request.url.path}:{ip}"
    try:
        count = await client.incr(key)
        if count == 1:
            await client.expire(key, window)
        if count > limit:
            raise HTTPException(429, f"Rate limit exceeded. Try again in {window}s.")
    except HTTPException:
        raise
    except Exception as e:
        if not fail_open:
            logger.error(
                "Rate limiting unavailable in strict mode (Redis error: %s). Failing closed.",
                type(e).__name__,
            )
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiter unavailable. Please try again shortly.",
            )
        # Fail open — don't block requests if Redis is unavailable
        # Log warning once to avoid log spam
        global _redis_warned
        if not _redis_warned:
            logger.warning(f"Rate limiting unavailable (Redis error: {type(e).__name__}). Failing open.")
            _redis_warned = True


def rate_limit_strict(limit: int = 10, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window, fail_open=False)
    return dependency


def rate_limit_normal(limit: int = 60, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window, fail_open=True)
    return dependency


def rate_limit_relaxed(limit: int = 200, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window, fail_open=True)
    return dependency
