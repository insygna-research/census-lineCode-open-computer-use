"""
Base class for AI providers
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator
import logging

logger = logging.getLogger(__name__)


class BaseProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, name: str):
        self.name = name
        self.api_key: Optional[str] = None
        self.client: Optional[Any] = None
        self.initialized = False
    
    def initialize(self, api_key: Optional[str] = None):
        """Initialize the provider with API key"""
        self.api_key = api_key
        self.client = self._create_client()
        self.initialized = True
    
    @abstractmethod
    def _create_client(self) -> Any:
        """Create the provider-specific client"""
        pass
    
    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[Dict] = None,
        **kwargs
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat completion"""
        pass
    
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, Any]],
        model: str,
        tools: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Non-streaming chat completion"""
        pass
    
    @abstractmethod
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models for this provider"""
        pass
    
    def format_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format messages for the provider's API"""
        # Default implementation - providers can override
        return messages
    
    def format_tools(self, tools: Dict) -> List[Dict]:
        """Format tools for the provider's API"""
        if not tools:
            return []
        
        formatted_tools = []
        for tool_name, tool_spec in tools.items():
            formatted_tools.append({
                "type": "function",
                "function": {
                    "name": tool_spec["name"],
                    "description": tool_spec["description"],
                    "parameters": tool_spec["parameters"]
                }
            })
        
        return formatted_tools
    
    async def execute_tool(self, tool_name: str, tool_args: Dict, tools: Dict) -> Any:
        """Execute a tool function"""
        if tool_name not in tools:
            raise ValueError(f"Tool {tool_name} not found")
        
        tool_spec = tools[tool_name]
        if "execute" not in tool_spec:
            raise ValueError(f"Tool {tool_name} has no execute function")
        
        # Execute the tool function
        result = await tool_spec["execute"](**tool_args)
        return result
    
    def handle_error(self, error: Exception) -> Dict[str, Any]:
        """Handle provider-specific errors"""
        logger.error(f"{self.name} provider error: {str(error)}")
        
        error_message = str(error)
        
        # Common error patterns
        if "api key" in error_message.lower() or "authentication" in error_message.lower():
            return {
                "type": "error",
                "error": "Authentication failed. Please check your API key."
            }
        elif "rate limit" in error_message.lower() or "429" in error_message:
            return {
                "type": "error",
                "error": "Rate limit exceeded. Please try again later."
            }
        elif "payment" in error_message.lower() or "402" in error_message:
            return {
                "type": "error",
                "error": "Insufficient credits or payment required."
            }
        else:
            return {
                "type": "error",
                "error": "An error occurred while processing your request."
            }
    
    def __str__(self) -> str:
        return f"{self.name} Provider"