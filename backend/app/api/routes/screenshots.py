"""
Screenshot API endpoints for retrieving stored screenshots
"""

import logging
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import base64
import io

from app.services.screenshot_storage import screenshot_storage
from app.utils.image_compression import ImageCompressor

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/screenshots/{screenshot_id}")
async def get_screenshot(screenshot_id: str):
    """
    Retrieve a stored screenshot by ID
    
    Args:
        screenshot_id: Unique screenshot identifier
        
    Returns:
        Image data as response
    """
    try:
        # Retrieve screenshot from storage
        screenshot_data = await screenshot_storage.retrieve_screenshot(screenshot_id)
        
        if not screenshot_data:
            raise HTTPException(status_code=404, detail="Screenshot not found")
        
        # Remove data URI prefix if present
        if screenshot_data.startswith("data:image"):
            header, data = screenshot_data.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0]
        else:
            data = screenshot_data
            mime_type = "image/png"
        
        # Decode base64
        image_bytes = base64.b64decode(data)
        
        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type=mime_type,
            headers={
                "Cache-Control": "max-age=3600",  # Cache for 1 hour
                "Content-Length": str(len(image_bytes))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve screenshot {screenshot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve screenshot")


@router.get("/screenshots/{screenshot_id}/preview")
async def get_screenshot_preview(screenshot_id: str):
    """
    Get a small preview thumbnail of the screenshot
    
    Args:
        screenshot_id: Unique screenshot identifier
        
    Returns:
        Thumbnail image
    """
    try:
        # Retrieve screenshot from storage
        screenshot_data = await screenshot_storage.retrieve_screenshot(screenshot_id)
        
        if not screenshot_data:
            raise HTTPException(status_code=404, detail="Screenshot not found")
        
        # Generate thumbnail
        thumbnail = ImageCompressor.extract_thumbnail(
            screenshot_data,
            thumbnail_size=(320, 180)
        )
        
        if not thumbnail:
            raise HTTPException(status_code=500, detail="Failed to generate thumbnail")
        
        # Remove data URI prefix and decode
        if thumbnail.startswith("data:image"):
            header, data = thumbnail.split(",", 1)
            mime_type = header.split(":")[1].split(";")[0]
        else:
            data = thumbnail
            mime_type = "image/jpeg"
        
        image_bytes = base64.b64decode(data)
        
        # Return thumbnail
        return StreamingResponse(
            io.BytesIO(image_bytes),
            media_type=mime_type,
            headers={
                "Cache-Control": "max-age=7200",  # Cache for 2 hours
                "Content-Length": str(len(image_bytes))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate preview for {screenshot_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate preview")


@router.get("/screenshots/stats")
async def get_storage_stats():
    """Get screenshot storage statistics"""
    try:
        stats = screenshot_storage.get_storage_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Failed to get storage stats: {str(e)}")
        return {"success": False, "error": str(e)}