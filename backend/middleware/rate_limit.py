import os
import logging
from fastapi import Request, HTTPException
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)
_redis_client = None
_redis_warned = False  # Track if we've already warned about Redis being unavailable


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
    return _redis_client


async def rate_limit(request: Request, limit: int = 60, window: int = 60):
    """Sliding window rate limiter. Default: 60 requests/minute per IP."""
    client = _get_redis()
    ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
    ip = ip.split(",")[0].strip()
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
        # Fail open — don't block requests if Redis is unavailable
        # Log warning once to avoid log spam
        global _redis_warned
        if not _redis_warned:
            logger.warning(f"Rate limiting unavailable (Redis error: {type(e).__name__}). Failing open.")
            _redis_warned = True


def rate_limit_strict(limit: int = 10, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency


def rate_limit_normal(limit: int = 60, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency


def rate_limit_relaxed(limit: int = 200, window: int = 60):
    async def dependency(request: Request):
        await rate_limit(request, limit, window)
    return dependency
