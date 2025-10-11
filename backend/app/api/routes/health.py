"""
Health check endpoints
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "llmhub-backend",
            "version": "1.0.0"
        }
    )


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # TODO: Check database connection, external services, etc.
    return JSONResponse(
        content={
            "status": "ready",
            "database": "connected",
            "cache": "connected"
        }
    )