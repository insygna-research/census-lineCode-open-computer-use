"""
Mistral provider implementation
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from mistralai import Mistral

from app.providers.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class MistralProvider(BaseProvider):
    """Mistral API provider"""
    
    def __init__(self):
        super().__init__("mistral")
        self.models = [
            {"id": "mistral-large-latest", "name": "Mistral Large", "context": 128000},
            {"id": "mistral-medium-latest", "name": "Mistral Medium", "context": 32000},
            {"id": "mistral-small-latest", "name": "Mistral Small", "context": 32000},
            {"id": "codestral-latest", "name": "Codestral", "context": 32000},
        ]
    
    def _create_client(self) -> Mistral:
        """Create Mistral client"""
        return Mistral(api_key=self.api_key or settings.MISTRAL_API_KEY)
    
    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[Dict] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion"""
        
        if not self.initialized:
            raise RuntimeError("Provider not initialized")
        
        try:
            # Stream the response
            async for chunk in self.client.chat.stream_async(
                model=model,
                messages=messages,
                **kwargs
            ):
                if chunk.data.choices[0].delta.content:
                    yield {"type": "text", "content": chunk.data.choices[0].delta.content}
            
            yield {"type": "finish", "content": ""}
        
        except Exception as e:
            logger.error(f"Mistral streaming error: {str(e)}")
            yield self.handle_error(e)
    
    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Non-streaming chat completion"""
        
        if not self.initialized:
            raise RuntimeError("Provider not initialized")
        
        try:
            response = await self.client.chat.complete_async(
                model=model,
                messages=messages,
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "finish_reason": response.choices[0].finish_reason
            }
        
        except Exception as e:
            logger.error(f"Mistral chat error: {str(e)}")
            return self.handle_error(e)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Mistral models"""
        return self.models