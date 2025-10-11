"""
Authentication service
"""

import logging
from typing import Optional, Dict, Any

from app.services.database import DatabaseService
from app.utils.encryption import decrypt_api_key

logger = logging.getLogger(__name__)

db_service = DatabaseService()


async def validate_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Validate user exists and is active"""
    
    try:
        user = await db_service.get_user(user_id)
        
        if not user:
            logger.warning(f"User {user_id} not found")
            return None
        
        # Check if user is active (if there's such a field)
        if user.get("status") == "inactive":
            logger.warning(f"User {user_id} is inactive")
            return None
        
        return user
    
    except Exception as e:
        logger.error(f"Error validating user {user_id}: {str(e)}")
        return None


async def get_user_api_key(
    user_id: str,
    provider: str
) -> Optional[str]:
    """Get user's API key for a provider"""
    
    try:
        encrypted_key = await db_service.get_user_api_key(user_id, provider)
        
        if not encrypted_key:
            return None
        
        # Decrypt the key
        return decrypt_api_key(encrypted_key)
    
    except Exception as e:
        logger.error(f"Error getting API key for user {user_id}, provider {provider}: {str(e)}")
        return None