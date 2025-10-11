"""
AI Provider service for managing multiple AI providers
"""

import logging
from typing import Dict, List, Optional, Any

from app.providers.provider_factory import ProviderFactory
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIProviderService:
    """Service for managing AI providers"""
    
    def __init__(self):
        self.provider_factory = ProviderFactory()
    
    def get_provider(self, model_id: str):
        """Get provider for a specific model"""
        return self.provider_factory.get_provider(model_id)
    
    def get_all_models(self) -> Dict[str, Any]:
        """Get all available models from all providers"""
        return self.provider_factory.get_all_models()
    
    def is_model_available(self, model_id: str, user_id: Optional[str] = None) -> bool:
        """Check if a model is available for a user"""
        
        # Check if model exists
        provider_name = self.provider_factory.get_provider_for_model(model_id)
        if not provider_name:
            return False
        
        # Check if it's a free model
        if model_id in settings.FREE_MODELS:
            return True
        
        # Check if user has API key for the provider
        if user_id:
            # TODO: Check user's API keys
            pass
        
        # Check if we have a system API key for the provider
        system_key = settings.get_provider_api_key(provider_name)
        return bool(system_key)