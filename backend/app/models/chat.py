"""
Chat data models and schemas
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, validator


class MessageRole(str, Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class ResearchDepth(str, Enum):
    """Research depth levels for search"""
    QUICK = "quick"
    MODERATE = "moderate"
    DEEP = "deep"


class Attachment(BaseModel):
    """File attachment model"""
    name: str
    type: str
    size: int
    url: Optional[str] = None
    content: Optional[str] = None


class ToolInvocation(BaseModel):
    """Tool invocation tracking"""
    tool_call_id: str = Field(alias="toolCallId")
    tool_name: str = Field(alias="toolName")
    state: str  # "call" or "result"
    args: Optional[Dict[str, Any]] = None
    result: Optional[Any] = None
    step: int = 0
    
    class Config:
        populate_by_name = True


class MessageContent(BaseModel):
    """Message content part"""
    type: str  # "text", "tool-invocation", "reasoning"
    text: Optional[str] = None
    tool_invocation: Optional[ToolInvocation] = Field(default=None, alias="toolInvocation")
    
    class Config:
        populate_by_name = True


class Message(BaseModel):
    """Chat message model"""
    role: MessageRole
    content: Union[str, List[MessageContent]]
    attachments: Optional[List[Attachment]] = Field(default=None, alias="experimental_attachments")
    tool_invocations: Optional[List[ToolInvocation]] = Field(default=None, alias="toolInvocations")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
    
    @validator("content", pre=True)
    def validate_content(cls, v):
        """Ensure content is properly formatted"""
        if isinstance(v, list):
            # Filter out incomplete tool invocations
            filtered_content = []
            for item in v:
                if isinstance(item, dict) and item.get("type") == "tool-invocation":
                    tool_inv = item.get("toolInvocation", {})
                    # Only keep complete tool invocations
                    if tool_inv.get("state") == "result" and "result" in tool_inv:
                        filtered_content.append(item)
                    elif tool_inv.get("state") == "call":
                        filtered_content.append(item)
                else:
                    filtered_content.append(item)
            return filtered_content
        return v


class VMScreenshot(BaseModel):
    """VM Screenshot data"""
    image_data: str = Field(alias="imageData")
    captured_at: str = Field(alias="capturedAt")
    width: int
    height: int
    
    class Config:
        populate_by_name = True


class VMConnectionDetails(BaseModel):
    """VM connection details"""
    public_ip: str = Field(alias="publicIp")
    vnc_port: int = Field(default=5900, alias="vncPort")
    websocket_port: int = Field(default=8080, alias="websocketPort")
    
    class Config:
        populate_by_name = True


class VMContext(BaseModel):
    """Virtual Machine context for chat"""
    machine_id: str = Field(alias="machineId")
    machine_name: str = Field(alias="machineName")
    session_id: Optional[str] = Field(default=None, alias="sessionId")
    status: str
    screenshot: Optional[VMScreenshot] = None
    connection_details: Optional[VMConnectionDetails] = Field(default=None, alias="connectionDetails")
    
    class Config:
        populate_by_name = True


class ChatRequest(BaseModel):
    """Chat API request model"""
    messages: List[Message]
    chat_id: str = Field(alias="chatId")
    user_id: str = Field(alias="userId")
    model: str
    is_authenticated: bool = Field(default=False, alias="isAuthenticated")
    system_prompt: Optional[str] = Field(default=None, alias="systemPrompt")
    enable_search: bool = Field(default=False, alias="enableSearch")
    force_search: bool = Field(default=False, alias="forceSearch")
    research_depth: ResearchDepth = Field(default=ResearchDepth.MODERATE, alias="researchDepth")
    message_group_id: Optional[str] = Field(default=None, alias="message_group_id")
    machine_id: Optional[str] = Field(default=None, alias="machineId")
    vm_context: Optional[VMContext] = Field(default=None, alias="vmContext")
    
    class Config:
        populate_by_name = True
    
    @validator("messages", pre=True)
    def clean_messages(cls, v):
        """Clean and validate messages"""
        if not v:
            return v
        
        # Remove incomplete tool invocations
        cleaned = []
        for msg in v:
            if isinstance(msg, dict):
                msg_obj = Message(**msg)
            else:
                msg_obj = msg
            cleaned.append(msg_obj)
        
        return cleaned


class ChatResponse(BaseModel):
    """Chat API response model"""
    message: str
    tool_calls: Optional[List[Dict]] = None
    tool_results: Optional[List[Dict]] = None
    reasoning: Optional[str] = None
    finish_reason: str = Field(default="stop", alias="finishReason")
    usage: Optional[Dict[str, int]] = None
    
    class Config:
        populate_by_name = True


class StreamChunk(BaseModel):
    """Streaming response chunk"""
    type: str  # "text", "tool_call", "tool_result", "reasoning", "error", "finish"
    content: Optional[str] = None
    tool_call: Optional[Dict] = None
    tool_result: Optional[Dict] = None
    error: Optional[str] = None
    finish_reason: Optional[str] = None