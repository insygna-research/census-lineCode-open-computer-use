"""
Provider factory for creating AI provider instances
"""

import logging
from typing import Optional, Dict, Any

from app.providers.base import BaseProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.google_provider import GoogleProvider
from app.providers.mistral_provider import MistralProvider
from app.providers.azure_openai_provider import AzureOpenAIProvider

logger = logging.getLogger(__name__)


class ProviderFactory:
    """Factory for creating AI provider instances"""
    
    def __init__(self):
        self.providers: Dict[str, BaseProvider] = {}
        self.model_provider_map = self._build_model_provider_map()
    
    def _build_model_provider_map(self) -> Dict[str, str]:
        """Build mapping of model IDs to provider names"""
        return {
            # OpenAI models
            "gpt-4o": "openai",
            "gpt-4o-mini": "openai",
            "gpt-4-turbo": "openai",
            "gpt-4-turbo-preview": "openai",
            "gpt-3.5-turbo": "openai",
            "o1-preview": "openai",
            "o1-mini": "openai",
            
            # Anthropic models
            "claude-3-5-sonnet-20241022": "anthropic",
            "claude-3-5-haiku-20241022": "anthropic",
            "claude-3-opus-20240229": "anthropic",
            "claude-3-sonnet-20240229": "anthropic",
            "claude-3-haiku-20240307": "anthropic",
            
            # Google models
            "gemini-2.0-flash-exp": "google",
            "gemini-1.5-pro-latest": "google",
            "gemini-1.5-flash-latest": "google",
            "gemini-1.5-flash-8b-latest": "google",
            
            # Mistral models
            "mistral-large-latest": "mistral",
            "mistral-medium-latest": "mistral",
            "mistral-small-latest": "mistral",
            "codestral-latest": "mistral",
            
            # DeepSeek models
            "deepseek-chat": "deepseek",
            "deepseek-coder": "deepseek",
            
            # xAI models
            "grok-beta": "xai",
            "grok-2-beta": "xai",
            
            # Perplexity models
            "llama-3.1-sonar-small-128k-online": "perplexity",
            "llama-3.1-sonar-large-128k-online": "perplexity",
            
            # Azure OpenAI models
            "azure-gpt-4o": "azure",
            "azure-gpt-4-turbo": "azure",
            "gpt-4.1-nano": "azure",
            "azure-gpt-4.1-nano": "azure",
        }
    
    def get_provider_for_model(self, model_id: str) -> Optional[str]:
        """Get provider name for a given model ID"""
        return self.model_provider_map.get(model_id)
    
    def get_provider(self, model_id: str) -> Optional[BaseProvider]:
        """Get or create provider instance for a model"""
        provider_name = self.get_provider_for_model(model_id)
        
        if not provider_name:
            logger.error(f"No provider found for model: {model_id}")
            return None
        
        # Check if provider already exists
        if provider_name in self.providers:
            return self.providers[provider_name]
        
        # Create new provider instance
        try:
            provider = self._create_provider(provider_name)
            if provider:
                self.providers[provider_name] = provider
                return provider
        except Exception as e:
            logger.error(f"Failed to create provider {provider_name}: {str(e)}")
        
        return None
    
    def _create_provider(self, provider_name: str) -> Optional[BaseProvider]:
        """Create a new provider instance"""
        try:
            if provider_name == "openai":
                return OpenAIProvider()
            elif provider_name == "anthropic":
                return AnthropicProvider()
            elif provider_name == "google":
                return GoogleProvider()
            elif provider_name == "mistral":
                return MistralProvider()
            elif provider_name == "azure":
                return AzureOpenAIProvider()
            # Add more providers as needed
            else:
                logger.warning(f"Unknown provider: {provider_name}")
                return None
        except Exception as e:
            logger.error(f"Error creating {provider_name} provider: {str(e)}")
            return None
    
    def get_all_models(self) -> Dict[str, Any]:
        """Get all available models from all providers"""
        all_models = {}
        
        for provider_name in ["openai", "anthropic", "google", "mistral"]:
            try:
                provider = self._create_provider(provider_name)
                if provider:
                    models = provider.get_available_models()
                    all_models[provider_name] = models
            except Exception as e:
                logger.error(f"Failed to get models from {provider_name}: {str(e)}")
        
        return all_models