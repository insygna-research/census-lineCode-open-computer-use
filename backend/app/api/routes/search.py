"""
Search API endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.search import SearchService

router = APIRouter()
search_service = SearchService()


class SearchRequest(BaseModel):
    query: str
    num_results: Optional[int] = 5
    enable_scraping: Optional[bool] = True


@router.post("/")
async def search(request: SearchRequest):
    """Perform web search"""
    try:
        results = await search_service.search(
            query=request.query,
            num_results=request.num_results,
            enable_scraping=request.enable_scraping
        )
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))