"""
Configuration management using Pydantic Settings
"""

import os
from typing import List, Optional, Union
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    # Server Configuration
    SERVER_HOST: str = Field(default="0.0.0.0")
    SERVER_PORT: int = Field(default=8001)
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    
    # CORS Settings  
    CORS_ORIGINS: Union[str, List[str]] = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:3002"
    )
    
    # Supabase Configuration
    SUPABASE_URL: str = Field(default="")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE: str = Field(default="")
    
    # Security
    ENCRYPTION_KEY: str = Field(default="")
    JWT_SECRET_KEY: str = Field(default="your-secret-key-change-in-production")
    CSRF_SECRET: str = Field(default="")
    
    # AI Provider API Keys
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None)
    GOOGLE_GENERATIVE_AI_API_KEY: Optional[str] = Field(default=None)
    MISTRAL_API_KEY: Optional[str] = Field(default=None)
    XAI_API_KEY: Optional[str] = Field(default=None)
    PERPLEXITY_API_KEY: Optional[str] = Field(default=None)
    DEEPSEEK_API_KEY: Optional[str] = Field(default=None)
    OPENROUTER_API_KEY: Optional[str] = Field(default=None)
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY: Optional[str] = Field(default=None)
    AZURE_OPENAI_ENDPOINT: Optional[str] = Field(default=None)
    AZURE_OPENAI_API_VERSION: str = Field(default="2024-02-15-preview")
    AZURE_OPENAI_DEPLOYMENT_NAME: Optional[str] = Field(default="gpt-4.1-nano")
    AZURE_OPENAI_DEPLOYMENT: Optional[str] = Field(default="gpt-4.1-nano")
    
    # Google Search Configuration
    GOOGLE_SEARCH_KEY: Optional[str] = Field(default=None)
    GOOGLE_SEARCH_CX: Optional[str] = Field(default=None)
    
    # Azure Container Instances
    AZURE_SUBSCRIPTION_ID: Optional[str] = Field(default=None)
    AZURE_RESOURCE_GROUP: Optional[str] = Field(default=None)
    AZURE_TENANT_ID: Optional[str] = Field(default=None)
    AZURE_CLIENT_ID: Optional[str] = Field(default=None)
    AZURE_CLIENT_SECRET: Optional[str] = Field(default=None)
    AZURE_CONTAINER_REGISTRY: Optional[str] = Field(default=None)
    AZURE_STORAGE_ACCOUNT: Optional[str] = Field(default=None)
    AZURE_STORAGE_KEY: Optional[str] = Field(default=None)
    
    # Redis Cache
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CACHE_ENABLED: bool = Field(default=False)
    CACHE_TTL: int = Field(default=300)  # 5 minutes
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True)
    RATE_LIMIT_PER_MINUTE: int = Field(default=60)
    RATE_LIMIT_PER_HOUR: int = Field(default=1000)
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    
    # Model Configuration
    FREE_MODELS: Union[str, List[str]] = Field(
        default="gpt-4o-mini,gpt-4.1-nano,azure-gpt-4.1-nano,claude-3-haiku-20240307,gemini-1.5-flash-latest,llama-3.2-90b-text-preview,deepseek-chat"
    )
    
    NON_AUTH_ALLOWED_MODELS: Union[str, List[str]] = Field(
        default="gpt-4o-mini,gpt-4.1-nano,azure-gpt-4.1-nano,claude-3-haiku-20240307,gemini-1.5-flash-latest"
    )
    
    # Request Configuration
    MAX_REQUEST_SIZE: int = Field(default=10 * 1024 * 1024)  # 10MB
    REQUEST_TIMEOUT: int = Field(default=60)  # seconds
    STREAM_TIMEOUT: int = Field(default=120)  # seconds
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        elif v is None:
            return ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
        return v
    
    @field_validator("FREE_MODELS", mode="before")
    @classmethod
    def parse_free_models(cls, v):
        if isinstance(v, str):
            return [model.strip() for model in v.split(",")]
        return v
    
    @field_validator("NON_AUTH_ALLOWED_MODELS", mode="before")
    @classmethod
    def parse_non_auth_models(cls, v):
        if isinstance(v, str):
            return [model.strip() for model in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production"""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development"""
        return self.ENVIRONMENT == "development"
    
    def get_provider_api_key(self, provider: str) -> Optional[str]:
        """Get API key for a specific provider"""
        provider_map = {
            "openai": self.OPENAI_API_KEY,
            "anthropic": self.ANTHROPIC_API_KEY,
            "google": self.GOOGLE_GENERATIVE_AI_API_KEY,
            "mistral": self.MISTRAL_API_KEY,
            "xai": self.XAI_API_KEY,
            "perplexity": self.PERPLEXITY_API_KEY,
            "deepseek": self.DEEPSEEK_API_KEY,
            "openrouter": self.OPENROUTER_API_KEY,
            "azure": self.AZURE_OPENAI_API_KEY,
        }
        return provider_map.get(provider)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Create a global settings instance
settings = get_settings()