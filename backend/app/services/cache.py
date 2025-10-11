"""
Cache service for Redis caching
"""

import logging
import json
from typing import Optional, Any
import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Service for caching operations"""
    
    def __init__(self):
        self.client: Optional[redis.Redis] = None
        self.enabled = settings.CACHE_ENABLED
    
    async def initialize(self):
        """Initialize Redis connection"""
        if not self.enabled:
            logger.info("Cache disabled")
            return
        
        try:
            self.client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.client.ping()
            logger.info("Redis cache connected")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis: {str(e)}")
            self.enabled = False
    
    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.client:
            return None
        
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error: {str(e)}")
            return None
    
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache"""
        if not self.enabled or not self.client:
            return False
        
        try:
            ttl = ttl or settings.CACHE_TTL
            await self.client.setex(
                key,
                ttl,
                json.dumps(value)
            )
            return True
        except Exception as e:
            logger.error(f"Cache set error: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        if not self.enabled or not self.client:
            return False
        
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error: {str(e)}")
            return False


# Global cache service instance
cache_service = CacheService()