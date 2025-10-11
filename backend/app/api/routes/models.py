"""
Model management endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.providers.provider_factory import ProviderFactory

router = APIRouter()
provider_factory = ProviderFactory()


@router.get("/")
async def get_models():
    """Get all available models"""
    try:
        models = provider_factory.get_all_models()
        return JSONResponse(content={"models": models})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{provider}")
async def get_provider_models(provider: str):
    """Get models for a specific provider"""
    try:
        provider_instance = provider_factory._create_provider(provider)
        if not provider_instance:
            raise HTTPException(status_code=404, detail=f"Provider {provider} not found")
        
        models = provider_instance.get_available_models()
        return JSONResponse(content={"provider": provider, "models": models})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))