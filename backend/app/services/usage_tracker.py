"""
Usage tracking service
"""

import logging
from typing import Dict, Any

from app.services.database import DatabaseService
from app.core.config import settings

logger = logging.getLogger(__name__)


class UsageTracker:
    """Service for tracking API usage"""
    
    def __init__(self):
        self.db_service = DatabaseService()
    
    async def check_and_increment(
        self,
        user_id: str,
        model: str,
        is_authenticated: bool
    ) -> bool:
        """Check usage limits and increment if allowed"""
        
        try:
            # Check current usage
            usage_info = await self.db_service.check_usage(
                user_id,
                model,
                is_authenticated
            )
            
            if not usage_info["allowed"]:
                logger.warning(
                    f"Usage limit exceeded for user {user_id}, "
                    f"model {model}, remaining: {usage_info['remaining']}"
                )
                return False
            
            # Increment usage
            await self.db_service.increment_usage(user_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error checking usage for user {user_id}: {str(e)}")
            # Allow request to proceed if there's an error
            return True
    
    async def get_usage_stats(
        self,
        user_id: str
    ) -> Dict[str, Any]:
        """Get usage statistics for a user"""
        
        try:
            # TODO: Implement detailed usage statistics
            return {
                "user_id": user_id,
                "daily_usage": 0,
                "monthly_usage": 0,
                "limits": {
                    "daily": 1000,
                    "monthly": 30000
                }
            }
        
        except Exception as e:
            logger.error(f"Error getting usage stats for user {user_id}: {str(e)}")
            return {}