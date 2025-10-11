"""
Search tool creation for agents
"""

import logging
from typing import List, Dict

from app.services.search import SearchService

logger = logging.getLogger(__name__)

# Initialize search service
search_service = SearchService()


def create_search_tool(research_depth: str = "moderate"):
    """Create the Google search tool"""
    
    async def execute_search(query: str) -> List[Dict]:
        """Execute search with the given query"""
        try:
            results = await search_service.search(
                query=query,
                num_results=search_service.get_results_count(research_depth),
                enable_scraping=True
            )
            return results
        except Exception as e:
            logger.error(f"Search failed: {str(e)}")
            return []
    
    return {
        "name": "googleSearch",
        "description": "MANDATORY TOOL: Search the web for current information",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                }
            },
            "required": ["query"]
        },
        "execute": execute_search
    }