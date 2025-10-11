"""
Web scraping service
"""

import logging
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import html2text

logger = logging.getLogger(__name__)


class WebScraperService:
    """Service for web scraping operations"""
    
    def __init__(self):
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = False
        self.html_converter.ignore_images = False
        self.html_converter.body_width = 0
    
    async def scrape_url(
        self,
        url: str,
        max_content_length: int = 5000,
        timeout: int = 10
    ) -> Optional[Dict[str, Any]]:
        """Scrape content from a single URL"""
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5",
                    "Accept-Encoding": "gzip, deflate, br",
                    "DNT": "1",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1"
                }
                
                async with session.get(
                    url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout)
                ) as response:
                    
                    if response.status != 200:
                        logger.warning(f"Failed to scrape {url}: HTTP {response.status}")
                        return None
                    
                    # Read content
                    html_content = await response.text()
                    
                    # Parse with BeautifulSoup
                    soup = BeautifulSoup(html_content, 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.decompose()
                    
                    # Extract title
                    title = soup.find('title')
                    title_text = title.text.strip() if title else ""
                    
                    # Extract meta description
                    meta_desc = soup.find('meta', attrs={'name': 'description'})
                    description = meta_desc.get('content', '') if meta_desc else ""
                    
                    # Convert to markdown
                    markdown_content = self.html_converter.handle(str(soup))
                    
                    # Truncate if needed
                    if len(markdown_content) > max_content_length:
                        markdown_content = markdown_content[:max_content_length] + "..."
                    
                    return {
                        "url": str(response.url),
                        "title": title_text,
                        "description": description,
                        "content": markdown_content,
                        "success": True
                    }
        
        except asyncio.TimeoutError:
            logger.error(f"Timeout scraping {url}")
            return {"url": url, "error": "Timeout", "success": False}
        
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            return {"url": url, "error": str(e), "success": False}
    
    async def scrape_multiple_urls(
        self,
        urls: List[str],
        max_content_length: int = 5000,
        timeout: int = 10
    ) -> List[Dict[str, Any]]:
        """Scrape content from multiple URLs in parallel"""
        
        tasks = [
            self.scrape_url(url, max_content_length, timeout)
            for url in urls
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and None results
        scraped_contents = []
        for result in results:
            if isinstance(result, dict) and result.get("success"):
                scraped_contents.append(result)
        
        return scraped_contents