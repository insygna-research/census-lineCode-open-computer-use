"""
Anthropic (Claude) provider implementation
"""

import json
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from anthropic import AsyncAnthropic

from app.providers.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseProvider):
    """Anthropic API provider"""
    
    def __init__(self):
        super().__init__("anthropic")
        self.models = [
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "context": 200000},
            {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku", "context": 200000},
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "context": 200000},
            {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "context": 200000},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "context": 200000},
        ]
    
    def _create_client(self) -> AsyncAnthropic:
        """Create Anthropic client"""
        return AsyncAnthropic(api_key=self.api_key or settings.ANTHROPIC_API_KEY)
    
    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[Dict] = None,
        max_steps: int = 10,
        temperature: float = 0.7,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion with tool support"""
        
        if not self.initialized:
            raise RuntimeError("Provider not initialized")
        
        try:
            # Extract system message
            system_message = None
            chat_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    chat_messages.append(msg)
            
            # Stream the response
            async with self.client.messages.stream(
                model=model,
                messages=chat_messages,
                system=system_message,
                temperature=temperature,
                max_tokens=4096,
                **kwargs
            ) as stream:
                async for event in stream:
                    if event.type == "content_block_delta":
                        if event.delta.type == "text_delta":
                            yield {"type": "text", "content": event.delta.text}
                    elif event.type == "message_stop":
                        yield {"type": "finish", "content": ""}
        
        except Exception as e:
            logger.error(f"Anthropic streaming error: {str(e)}")
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
            # Extract system message
            system_message = None
            chat_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    chat_messages.append(msg)
            
            response = await self.client.messages.create(
                model=model,
                messages=chat_messages,
                system=system_message,
                max_tokens=4096,
                **kwargs
            )
            
            return {
                "content": response.content[0].text if response.content else "",
                "finish_reason": response.stop_reason
            }
        
        except Exception as e:
            logger.error(f"Anthropic chat error: {str(e)}")
            return self.handle_error(e)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available Anthropic models"""
        return self.models