"""
OpenAI provider implementation
"""

import json
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from openai.types.chat.chat_completion_chunk import Choice, ChoiceDelta

from app.providers.base import BaseProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIProvider(BaseProvider):
    """OpenAI API provider"""
    
    def __init__(self):
        super().__init__("openai")
        self.models = [
            {"id": "gpt-4o", "name": "GPT-4o", "context": 128000},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "context": 128000},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "context": 128000},
            {"id": "gpt-4-turbo-preview", "name": "GPT-4 Turbo Preview", "context": 128000},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "context": 16385},
            {"id": "o1-preview", "name": "o1 Preview", "context": 128000},
            {"id": "o1-mini", "name": "o1 Mini", "context": 128000},
        ]
    
    def _create_client(self) -> AsyncOpenAI:
        """Create OpenAI client"""
        return AsyncOpenAI(api_key=self.api_key or settings.OPENAI_API_KEY)
    
    def format_messages(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format messages for OpenAI API - handle tool-invocation content type"""
        formatted_messages = []
        
        for message in messages:
            # Create a copy of the message to avoid modifying the original
            formatted_message = {"role": message.get("role")}
            
            # Handle content field
            content = message.get("content")
            
            # Check if content is a list (multi-part message)
            if isinstance(content, list):
                # Filter out tool-invocation parts and convert to text
                text_parts = []
                for part in content:
                    if isinstance(part, dict):
                        part_type = part.get("type")
                        if part_type == "text":
                            text_parts.append(part.get("text", ""))
                        elif part_type == "tool-invocation":
                            # Convert tool invocation to text representation
                            tool_info = part.get("toolInvocation", {})
                            tool_name = tool_info.get("toolName", "unknown_tool")
                            tool_state = tool_info.get("state", "pending")
                            
                            # Add a text representation of the tool invocation
                            if tool_state == "result":
                                text_parts.append(f"[Tool: {tool_name} - completed]")
                            else:
                                text_parts.append(f"[Tool: {tool_name} - {tool_state}]")
                        # OpenAI supports these types
                        elif part_type in ["image_url"]:
                            # Keep image_url parts as they are supported by OpenAI
                            text_parts.append(part)
                
                # Combine text parts or use the original if there are supported multi-part contents
                if all(isinstance(p, str) for p in text_parts):
                    # All parts are text, combine them
                    formatted_message["content"] = " ".join(text_parts).strip()
                else:
                    # There are mixed types, keep as list but filter out tool-invocations
                    formatted_message["content"] = [p for p in text_parts if not isinstance(p, str)]
                    # Add text parts as a single text entry if any exist
                    text_content = " ".join([p for p in text_parts if isinstance(p, str)]).strip()
                    if text_content:
                        formatted_message["content"].insert(0, {"type": "text", "text": text_content})
            else:
                # Content is a string or None, keep as-is
                formatted_message["content"] = content
            
            # Preserve other fields like tool_calls
            if "tool_calls" in message:
                formatted_message["tool_calls"] = message["tool_calls"]
            
            # For tool responses
            if "tool_call_id" in message:
                formatted_message["tool_call_id"] = message["tool_call_id"]
            
            formatted_messages.append(formatted_message)
        
        return formatted_messages
    
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
            formatted_messages = self.format_messages(messages)
            formatted_tools = self.format_tools(tools) if tools else None
            
            # Track tool calls and results
            tool_calls = []
            current_step = 0
            
            while current_step < max_steps:
                # Make the API call
                stream = await self.client.chat.completions.create(
                    model=model,
                    messages=formatted_messages,
                    tools=formatted_tools,
                    tool_choice="auto" if formatted_tools else None,
                    temperature=temperature,
                    stream=True,
                    **kwargs
                )
                
                # Collect the response
                full_response = ""
                current_tool_calls = []
                
                async for chunk in stream:
                    delta = chunk.choices[0].delta if chunk.choices else None
                    
                    if not delta:
                        continue
                    
                    # Handle text content
                    if delta.content:
                        full_response += delta.content
                        yield {"type": "text", "content": delta.content}
                    
                    # Handle tool calls
                    if delta.tool_calls:
                        for tool_call in delta.tool_calls:
                            # Track tool call
                            if len(current_tool_calls) <= tool_call.index:
                                current_tool_calls.append({
                                    "id": "",
                                    "type": "function",
                                    "function": {"name": "", "arguments": ""}
                                })
                            
                            tc = current_tool_calls[tool_call.index]
                            
                            if tool_call.id:
                                tc["id"] = tool_call.id
                            if tool_call.function.name:
                                tc["function"]["name"] = tool_call.function.name
                            if tool_call.function.arguments:
                                tc["function"]["arguments"] += tool_call.function.arguments
                
                # Process tool calls if any
                if current_tool_calls and tools:
                    # Add assistant message with tool calls
                    formatted_messages.append({
                        "role": "assistant",
                        "content": full_response if full_response else None,
                        "tool_calls": current_tool_calls
                    })
                    
                    # Execute tools and collect results
                    for tool_call in current_tool_calls:
                        tool_name = tool_call["function"]["name"]
                        tool_args = json.loads(tool_call["function"]["arguments"])
                        
                        # Yield tool call event
                        yield {
                            "type": "tool_call",
                            "toolCallId": tool_call["id"],
                            "toolName": tool_name,
                            "args": tool_args
                        }
                        
                        # Execute the tool
                        try:
                            result = await self.execute_tool(tool_name, tool_args, tools)
                            
                            # Filter out frontendScreenshot for model (it's for display only)
                            result_for_model = result
                            has_screenshot = False
                            if isinstance(result, dict) and "frontendScreenshot" in result:
                                result_for_model = {k: v for k, v in result.items() if k != "frontendScreenshot"}
                                has_screenshot = True
                                logger.info(f"Tool {tool_name} result contains screenshot ({len(result.get('frontendScreenshot', ''))} chars) - filtering for model, keeping for frontend")
                            
                            # Add filtered result to messages for model
                            formatted_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call["id"],
                                "content": json.dumps(result_for_model) if not isinstance(result_for_model, str) else result_for_model
                            })
                            
                            # Yield FULL result (with screenshot) to frontend
                            yield {
                                "type": "tool_result",
                                "toolCallId": tool_call["id"],
                                "toolName": tool_name,
                                "result": result  # Full result including screenshot for frontend
                            }
                        except Exception as e:
                            logger.error(f"Tool execution error: {str(e)}")
                            formatted_messages.append({
                                "role": "tool",
                                "tool_call_id": tool_call["id"],
                                "content": f"Error: {str(e)}"
                            })
                    
                    current_step += 1
                else:
                    # No tool calls, we're done
                    break
            
            # Yield finish event
            yield {
                "type": "finish",
                "content": full_response,
                "tool_invocations": tool_calls
            }
        
        except Exception as e:
            logger.error(f"OpenAI streaming error: {str(e)}")
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
            formatted_messages = self.format_messages(messages)
            formatted_tools = self.format_tools(tools) if tools else None
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                tools=formatted_tools,
                tool_choice="auto" if formatted_tools else None,
                **kwargs
            )
            
            message = response.choices[0].message
            
            result = {
                "content": message.content,
                "tool_calls": None,
                "finish_reason": response.choices[0].finish_reason
            }
            
            if message.tool_calls:
                result["tool_calls"] = [
                    {
                        "id": tc.id,
                        "type": tc.type,
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in message.tool_calls
                ]
            
            return result
        
        except Exception as e:
            logger.error(f"OpenAI chat error: {str(e)}")
            return self.handle_error(e)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get available OpenAI models"""
        return self.models