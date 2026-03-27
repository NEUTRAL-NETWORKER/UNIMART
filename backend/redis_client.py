import os
import redis
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("unimart.redis")

# Redis connection — defaults to localhost for local development
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create a connection pool to handle multiple concurrent requests
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True, health_check_interval=30)
    # Test connection
    redis_client.ping()
    logger.info("Successfully connected to Redis")
except redis.ConnectionError as e:
    logger.warning("Failed to connect to Redis at %s", REDIS_URL)
    # We allow the app to run without Redis strictly for very early local dev, 
    # but auth endpoints won't work correctly without it.
    redis_client = None
