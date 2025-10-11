"""
Search service for web searching functionality
"""

import logging
import asyncio
import aiohttp
import ssl
import certifi
from typing import List, Dict, Any, Optional
from urllib.parse import quote_plus

from app.core.config import settings
from app.services.web_scraper import WebScraperService

logger = logging.getLogger(__name__)


class SearchService:
    """Service for web search operations"""
    
    def __init__(self):
        self.scraper = WebScraperService()
        self.google_api_key = settings.GOOGLE_SEARCH_KEY
        self.google_cx = settings.GOOGLE_SEARCH_CX
    
    def get_results_count(self, research_depth: str) -> int:
        """Get number of results based on research depth"""
        depth_map = {
            "quick": 3,
            "moderate": 5,
            "deep": 10
        }
        return depth_map.get(research_depth, 5)
    
    async def search(
        self,
        query: str,
        num_results: int = 5,
        enable_scraping: bool = True
    ) -> List[Dict[str, Any]]:
        """Perform web search using Google Custom Search API"""
        
        if not query or not query.strip():
            logger.error("Empty search query provided")
            return []
        
        if not self.google_api_key or not self.google_cx:
            logger.error("Google Search API credentials not configured")
            return []
        
        try:
            # Prepare search parameters
            params = {
                "key": self.google_api_key,
                "cx": self.google_cx,
                "q": query.strip(),
                "num": str(num_results),
                "hl": "en",
                "gl": "us",
                "safe": "active",
                "fields": "items(title,link,snippet,pagemap)"
            }
            
            # Create SSL context with certifi certificates
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            ssl_context.check_hostname = True
            ssl_context.verify_mode = ssl.CERT_REQUIRED
            
            # Create connector with SSL context
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            
            # Make the API request
            async with aiohttp.ClientSession(connector=connector) as session:
                url = "https://customsearch.googleapis.com/customsearch/v1"
                
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Google Search API error {response.status}: {error_text}")
                        return []
                    
                    data = await response.json()
            
            # Check if we have results
            if not data.get("items"):
                logger.warning(f"No search results found for query: {query}")
                return []
            
            # Process results
            results = []
            for item in data["items"]:
                result = {
                    "title": item.get("title", "No title"),
                    "url": item.get("link", "#"),
                    "snippet": item.get("snippet", "No description available")
                }
                
                # Extract images from pagemap if available
                if item.get("pagemap"):
                    pagemap = item["pagemap"]
                    
                    # Try to get OpenGraph image
                    if pagemap.get("metatags") and pagemap["metatags"]:
                        metatag = pagemap["metatags"][0]
                        result["image"] = (
                            metatag.get("og:image") or
                            metatag.get("twitter:image") or
                            metatag.get("image")
                        )
                    
                    # Try to get thumbnail
                    if pagemap.get("cse_thumbnail") and pagemap["cse_thumbnail"]:
                        result["thumbnail"] = pagemap["cse_thumbnail"][0].get("src")
                    elif pagemap.get("cse_image") and pagemap["cse_image"]:
                        result["thumbnail"] = pagemap["cse_image"][0].get("src")
                
                results.append(result)
            
            # Scrape content if enabled
            if enable_scraping and results:
                await self._scrape_search_results(results)
            
            return results
        
        except asyncio.TimeoutError:
            logger.error("Google Search API request timed out")
            return []
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return []
    
    async def _scrape_search_results(self, results: List[Dict[str, Any]]):
        """Scrape content from search result URLs"""
        
        # Filter valid URLs
        urls = []
        for result in results:
            url = result["url"]
            if url and url != "#" and not any(
                url.lower().endswith(ext) for ext in 
                ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.mp3', '.mp4']
            ):
                urls.append(url)
        
        if not urls:
            return
        
        # Scrape URLs in parallel
        scraped_contents = await self.scraper.scrape_multiple_urls(
            urls,
            max_content_length=3000,
            timeout=6
        )
        
        # Match scraped content with results
        url_to_content = {content["url"]: content for content in scraped_contents}
        
        for result in results:
            if result["url"] in url_to_content:
                result["scrapedContent"] = url_to_content[result["url"]]
    
    async def generate_enhanced_query(
        self,
        messages: List[Dict[str, str]],
        current_query: str
    ) -> str:
        """Generate an enhanced search query based on conversation context"""
        
        # For now, return the original query
        # This can be enhanced with AI to generate better queries
        return current_query