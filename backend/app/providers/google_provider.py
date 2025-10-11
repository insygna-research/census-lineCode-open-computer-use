"""
Google (Gemini) provider implementation
"""

import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

import google.generativeai as genai

from app.providers.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class GoogleProvider(BaseProvider):
    """Google Gemini API provider"""
    
    def __init__(self):
        super().__init__("google")
        self.models = [
            {"id": "gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash Experimental", "context": 1048576},
            {"id": "gemini-1.5-pro-latest", "name": "Gemini 1.5 Pro", "context": 1048576},
            {"id": "gemini-1.5-flash-latest", "name": "Gemini 1.5 Flash", "context": 1048576},
            {"id": "gemini-1.5-flash-8b-latest", "name": "Gemini 1.5 Flash 8B", "context": 1048576},
        ]
    
    def _create_client(self) -> Any:
        """Configure Google Gemini"""
        genai.configure(api_key=self.api_key or settings.GOOGLE_GENERATIVE_AI_API_KEY)
        return genai
    
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
            # Create model instance
            gemini_model = self.client.GenerativeModel(model)
            
            # Convert messages to Gemini format
            chat = gemini_model.start_chat(history=[])
            
            # Get the last user message
            last_message = messages[-1]["content"] if messages else ""
            
            # Stream the response
            response = await chat.send_message_async(last_message, stream=True)
            
            async for chunk in response:
                if chunk.text:
                    yield {"type": "text", "content": chunk.text}
            
            yield {"type": "finish", "content": ""}
        
        except Exception as e:
            logger.error(f"Google streaming error: {str(e)}")
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
            # Create model instance
            gemini_model = self.client.GenerativeModel(model)
            
            # Convert messages to Gemini format
            chat = gemini_model.start_chat(history=[])
            
            # Get the last user message
            last_message = messages[-1]["content"] if messages else ""
            
            # Get response
            response = await chat.send_message_async(last_message)
            
            return {
                "content": response.text,
                "finish_reason": "stop"
            }
        
        except Exception as e:
            logger.error(f"Google chat error: {str(e)}")
            return self.handle_error(e)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Google models"""
        return self.models