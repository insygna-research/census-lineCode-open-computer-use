"""
Comprehensive VM Tools for Chat - Based on new AI Agent Server
"""

import logging
import json
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


def create_comprehensive_vm_tools(machine_id: str, connection_info: Optional[Dict] = None) -> Dict:
    """
    Create comprehensive VM control tools for computer automation
    Based on the new AI agent server with enhanced capabilities
    """
    tools = {}
    
    # Store connection info for all tools to use
    vm_info = connection_info or {}
    
    # Import vm_control_service here to avoid circular import
    from app.services.vm_control import vm_control_service
    
    # Helper function to filter out screenshots from results before sending to model
    def filter_screenshot_for_model(result: Dict) -> Dict:
        """Remove frontendScreenshot from result so model doesn't see it"""
        if isinstance(result, dict) and "frontendScreenshot" in result:
            # Create a copy without the screenshot
            filtered = {k: v for k, v in result.items() if k != "frontendScreenshot"}
            logger.debug(f"Filtered out screenshot from result (size: {len(result.get('frontendScreenshot', ''))} chars)")
            return filtered
        return result
    
    # Helper function to ensure connection
    async def ensure_connection() -> bool:
        """Ensure we have an active connection to the VM agent"""
        # Check if we already have an active connection
        if machine_id in vm_control_service.connections:
            ws = vm_control_service.connections[machine_id]
            if not ws.closed:
                return True
            # Connection is closed, remove it
            del vm_control_service.connections[machine_id]
        
        # Try to establish connection if we have the info
        if vm_info.get("public_ip"):
            # Determine default port based on IP (8081 for localhost, 8080 for others)
            public_ip = vm_info.get("public_ip", "")
            default_port = 8081 if public_ip == "localhost" else 8080
            agent_port = vm_info.get("agent_port", default_port)
            
            logger.info(f"Establishing connection to VM {machine_id} at {public_ip}:{agent_port}")
            return await vm_control_service.connect_to_agent(
                machine_id,
                vm_info["public_ip"],
                agent_port,
                vm_info.get("session_id"),
                vm_info.get("user_id"),
                vm_info.get("vnc_password")  # Pass the password for authentication
            )
        
        logger.error(f"No connection info available for machine {machine_id}")
        return False
    
    # =================
    # DESKTOP COMMANDS
    # =================
    
    # Screenshot tool
    async def screenshot() -> Dict:
        """Take a screenshot of the current desktop"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        result = await vm_control_service.execute_command(machine_id, "screenshot", {})
        if result.get("success") and result.get("screenshot"):
            return {
                "success": True,
                "screenshot": result["screenshot"],
                "format": "base64",
                "resolution": result.get("resolution", "unknown")
            }
        return result
    
    tools["screenshot"] = {
        "name": "screenshot",
        "description": "Capture a screenshot of the current desktop display. Returns base64-encoded image data that can be analyzed for UI elements, text, and visual state.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        },
        "execute": screenshot
    }
    
    # Detect UI elements tool
    async def detect_elements(
        include_text: bool = True,
        include_clickable: bool = True,
        include_ui: bool = True,
        multi_scale: bool = True
    ) -> Dict:
        """Detect UI elements on screen"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {
            "include_text": include_text,
            "include_clickable": include_clickable,
            "include_ui": include_ui,
            "multi_scale": multi_scale
        }
        return await vm_control_service.execute_command(machine_id, "detect_elements", params)
    
    tools["detect_elements"] = {
        "name": "detect_elements",
        "description": "Detect and locate all UI elements visible on screen using computer vision. Returns coordinates and properties of text, buttons, and interactive elements. Use before clicking to find exact coordinates.",
        "parameters": {
            "type": "object",
            "properties": {
                "include_text": {
                    "type": "boolean", 
                    "default": True,
                    "description": "Whether to detect text elements (labels, paragraphs, etc.)"
                },
                "include_clickable": {
                    "type": "boolean", 
                    "default": True,
                    "description": "Whether to detect clickable elements (buttons, links, checkboxes)"
                },
                "include_ui": {
                    "type": "boolean", 
                    "default": True,
                    "description": "Whether to detect general UI elements (windows, panels, menus)"
                },
                "multi_scale": {
                    "type": "boolean", 
                    "default": True,
                    "description": "Whether to use multi-scale detection for better accuracy"
                }
            },
            "required": [],
            "additionalProperties": False
        },
        "execute": detect_elements
    }
    
    # Click tool
    async def click(x: int, y: int, button: str = "left", double: bool = False) -> Dict:
        """Click at specific coordinates"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        command = "double_click" if double else "click"
        params = {"x": x, "y": y}
        if button != "left":
            params["button"] = button
        
        return await vm_control_service.execute_command(machine_id, command, params)
    
    tools["click"] = {
        "name": "click",
        "description": "Perform a mouse click at specific screen coordinates. Use detect_elements or screenshot first to identify target coordinates. Single or double click supported.",
        "parameters": {
            "type": "object",
            "properties": {
                "x": {
                    "type": "integer", 
                    "description": "Horizontal position in pixels from left edge of screen"
                },
                "y": {
                    "type": "integer", 
                    "description": "Vertical position in pixels from top edge of screen"
                },
                "button": {
                    "type": "string", 
                    "enum": ["left", "right", "middle"], 
                    "default": "left",
                    "description": "Which mouse button to click"
                },
                "double": {
                    "type": "boolean", 
                    "default": False,
                    "description": "Whether to perform a double-click instead of single click"
                }
            },
            "required": ["x", "y"],
            "additionalProperties": False
        },
        "execute": click
    }
    
    # Type text tool
    async def type_text(text: str) -> Dict:
        """Type text at current cursor position"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "type", {"text": text})
    
    tools["type"] = {
        "name": "type",
        "description": "Type text at the current cursor position. Simulates keyboard input character by character. Ensure the target field is focused (clicked) before typing.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string", 
                    "description": "The text string to type, supports all printable characters"
                }
            },
            "required": ["text"],
            "additionalProperties": False
        },
        "execute": type_text
    }
    
    # Key press tool
    async def key_press(keys: List[str]) -> Dict:
        """Press specific keyboard keys"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "key_press", {"keys": keys})
    
    tools["key"] = {
        "name": "key",
        "description": "Press special keyboard keys sequentially. Use for navigation (Tab, Enter, Escape) or editing (Backspace, Delete). For key combinations use 'shortcut' instead.",
        "parameters": {
            "type": "object",
            "properties": {
                "keys": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["enter", "tab", "escape", "backspace", "delete", "up", "down", "left", "right", "home", "end", "pageup", "pagedown", "space", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]
                    },
                    "description": "Special keys to press in sequence. Example: ['tab', 'tab', 'enter'] to navigate through form fields"
                }
            },
            "required": ["keys"],
            "additionalProperties": False
        },
        "execute": key_press
    }
    
    # Keyboard combo tool
    async def key_combo(keys: List[str]) -> Dict:
        """Execute keyboard combination"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "key_combo", {"keys": keys})
    
    tools["shortcut"] = {
        "name": "shortcut",
        "description": "Execute keyboard shortcuts by pressing multiple keys simultaneously. Common shortcuts: ['ctrl','c'] for copy, ['ctrl','v'] for paste, ['ctrl','a'] for select all, ['alt','tab'] for switch window.",
        "parameters": {
            "type": "object",
            "properties": {
                "keys": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["ctrl", "alt", "shift", "cmd", "win", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "tab", "enter", "space", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"]
                    },
                    "minItems": 2,
                    "maxItems": 4,
                    "description": "Keys to press simultaneously. First key is usually modifier (ctrl/alt/shift)"
                }
            },
            "required": ["keys"],
            "additionalProperties": False
        },
        "execute": key_combo
    }
    
    # New Terminal Management Tools (Browser-like)
    async def terminal_connect() -> Dict:
        """Connect to terminal session (creates new if none exists)"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "terminal_connect", {})
    
    tools["terminal_connect"] = {
        "name": "terminal_connect",
        "description": "Open a new terminal window for executing shell commands. Only use when terminal commands are required. For file operations, prefer file_* tools which are faster and more reliable. Returns window_id to track the session.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        },
        "execute": terminal_connect
    }
    
    async def terminal_execute(command: str, wait_for_output: bool = True, timeout: int = 5) -> Dict:
        """Execute command in terminal and get output"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {
            "command": command,
            "wait_for_output": wait_for_output,
            "timeout": timeout
        }
        return await vm_control_service.execute_command(machine_id, "terminal_execute", params)
    
    tools["terminal_execute"] = {
        "name": "terminal_execute",
        "description": "Execute a shell command in the terminal and retrieve its output. Requires terminal_connect to be called first. Returns stdout, stderr, and exit_code. Execute one command at a time for reliable results.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string", 
                    "description": "Shell command to execute. Examples: 'ls -la', 'pwd', 'npm install', 'python script.py'"
                },
                "wait_for_output": {
                    "type": "boolean", 
                    "default": True,
                    "description": "Whether to wait for command completion and capture output"
                },
                "timeout": {
                    "type": "integer", 
                    "default": 5,
                    "minimum": 1,
                    "maximum": 60,
                    "description": "Maximum seconds to wait for command completion"
                }
            },
            "required": ["command"],
            "additionalProperties": False
        },
        "execute": terminal_execute
    }
    
    async def terminal_type(text: str) -> Dict:
        """Type text in terminal without executing"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "terminal_type", {"text": text})
    
    tools["terminal_type"] = {
        "name": "terminal_type",
        "description": "Type text in terminal without executing (no Enter key). Useful for building complex commands.",
        "parameters": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to type"}
            },
            "required": ["text"]
        },
        "execute": terminal_type
    }
    
    async def terminal_read() -> Dict:
        """Read current terminal output and history"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "terminal_read", {})
    
    tools["terminal_read"] = {
        "name": "terminal_read",
        "description": "Read the last executed command's output from history. Shows last command, its output, and recent command history. Useful for checking results of previous commands.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": terminal_read
    }
    
    async def terminal_clear() -> Dict:
        """Clear terminal screen"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "terminal_clear", {})
    
    tools["terminal_clear"] = {
        "name": "terminal_clear",
        "description": "Clear the terminal screen",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": terminal_clear
    }
    
    async def terminal_close() -> Dict:
        """Close terminal session"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "terminal_close", {})
    
    tools["terminal_close"] = {
        "name": "terminal_close",
        "description": "Close ONLY the terminal window opened by this agent. Uses window ID to ensure it doesn't close user's existing terminals. Types 'exit' for graceful shutdown.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": terminal_close
    }
    
    # File operation tools - standardized and reliable
    async def file_read(filepath: str) -> Dict:
        """Read file contents reliably"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_read", {"filepath": filepath})
    
    tools["file_read"] = {
        "name": "file_read",
        "description": "Read the complete contents of a file. More efficient than using terminal commands like cat. Relative paths are resolved from /home/desktop/Desktop.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {
                    "type": "string", 
                    "description": "Absolute or relative path to the file. Example: 'document.txt' or '/home/desktop/file.txt'"
                }
            },
            "required": ["filepath"],
            "additionalProperties": False
        },
        "execute": file_read
    }
    
    async def file_write(filepath: str, content: str) -> Dict:
        """Write/create file with content"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_write", {
            "filepath": filepath,
            "content": content
        })
    
    tools["file_write"] = {
        "name": "file_write",
        "description": "Create a new file or overwrite an existing file with the specified content. Handles multi-line text properly. More reliable than echo/printf commands.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {
                    "type": "string", 
                    "description": "Path where the file will be created. Existing files will be overwritten."
                },
                "content": {
                    "type": "string", 
                    "description": "Text content to write to the file, can include newlines and special characters"
                }
            },
            "required": ["filepath", "content"],
            "additionalProperties": False
        },
        "execute": file_write
    }
    
    async def file_edit(filepath: str, find: str, replace: str) -> Dict:
        """Edit file by replacing text"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_edit", {
            "filepath": filepath,
            "find": find,
            "replace": replace
        })
    
    tools["file_edit"] = {
        "name": "file_edit",
        "description": "Edit file directly by replacing text (NO terminal_connect needed). Creates backup. Relative paths use /home/desktop/Desktop as base. ⚠️ Use this instead of sed/awk.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Path to the file to edit"},
                "find": {"type": "string", "description": "Text to find in the file"},
                "replace": {"type": "string", "description": "Text to replace with"}
            },
            "required": ["filepath", "find", "replace"]
        },
        "execute": file_edit
    }
    
    async def file_append(filepath: str, content: str) -> Dict:
        """Append content to file"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_append", {
            "filepath": filepath,
            "content": content
        })
    
    tools["file_append"] = {
        "name": "file_append",
        "description": "Append to file directly (NO terminal_connect needed). Creates file if doesn't exist. Relative paths use /home/desktop/Desktop as base. ⚠️ Use this instead of >> redirection.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Path to the file to append to"},
                "content": {"type": "string", "description": "Content to append to the file"}
            },
            "required": ["filepath", "content"]
        },
        "execute": file_append
    }
    
    async def file_delete(filepath: str) -> Dict:
        """Delete a file"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_delete", {"filepath": filepath})
    
    tools["file_delete"] = {
        "name": "file_delete",
        "description": "Delete file directly (NO terminal_connect needed). Relative paths use /home/desktop/Desktop as base. ⚠️ Use this instead of rm commands.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Path to the file to delete"}
            },
            "required": ["filepath"]
        },
        "execute": file_delete
    }
    
    async def file_exists(filepath: str) -> Dict:
        """Check if file exists"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "file_exists", {"filepath": filepath})
    
    tools["file_exists"] = {
        "name": "file_exists",
        "description": "Check if file exists directly (NO terminal_connect needed). Returns existence status and file details. Relative paths use /home/desktop/Desktop as base.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Path to check for file existence"}
            },
            "required": ["filepath"]
        },
        "execute": file_exists
    }
    
    async def directory_list(dirpath: str = "") -> Dict:
        """List all files and directories in a directory"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "directory_list", {"dirpath": dirpath})
    
    tools["directory_list"] = {
        "name": "directory_list",
        "description": "List all files and subdirectories in a directory (NO terminal_connect needed). Returns detailed info including sizes, permissions, and modification times. If no path provided, lists Desktop. Relative paths use /home/desktop/Desktop as base.",
        "parameters": {
            "type": "object",
            "properties": {
                "dirpath": {"type": "string", "description": "Path to the directory to list (optional, defaults to Desktop)"}
            },
            "required": []
        },
        "execute": directory_list
    }
    
    async def directory_delete(dirpath: str) -> Dict:
        """Delete a directory and all its contents"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "directory_delete", {"dirpath": dirpath})
    
    tools["directory_delete"] = {
        "name": "directory_delete",
        "description": "Delete a directory and ALL its contents recursively (NO terminal_connect needed). Use with caution! Relative paths use /home/desktop/Desktop as base. ⚠️ This permanently deletes the directory and everything inside it.",
        "parameters": {
            "type": "object",
            "properties": {
                "dirpath": {"type": "string", "description": "Path to the directory to delete"}
            },
            "required": ["dirpath"]
        },
        "execute": directory_delete
    }
    
    # OCR tool
    async def ocr(region: Optional[Dict] = None) -> Dict:
        """Perform OCR on screen or region"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {}
        if region:
            params["region"] = region
        
        return await vm_control_service.execute_command(machine_id, "ocr", params)
    
    tools["ocr"] = {
        "name": "ocr",
        "description": "Perform OCR (Optical Character Recognition) on the screen",
        "parameters": {
            "type": "object",
            "properties": {
                "region": {
                    "type": "object",
                    "properties": {
                        "x": {"type": "integer"},
                        "y": {"type": "integer"},
                        "width": {"type": "integer"},
                        "height": {"type": "integer"}
                    },
                    "description": "Optional region to OCR (default: full screen)"
                }
            },
            "required": []
        },
        "execute": ocr
    }
    
    # File transfer tools
    async def file_upload(filepath: str, content: str, encoding: str = "utf-8") -> Dict:
        """Upload a file to the VM container"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {
            "filepath": filepath,
            "content": content,
            "encoding": encoding  # "utf-8" for text, "base64" for binary
        }
        return await vm_control_service.execute_command(machine_id, "file_upload", params)
    
    tools["file_upload"] = {
        "name": "file_upload",
        "description": "Upload a file to the VM desktop. Supports both text and binary files (use base64 encoding for binary). Files are saved relative to /home/desktop/Desktop unless absolute path is provided.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {
                    "type": "string",
                    "description": "Path where the file will be saved. Relative paths use Desktop as base."
                },
                "content": {
                    "type": "string",
                    "description": "File content (text or base64-encoded binary data)"
                },
                "encoding": {
                    "type": "string",
                    "enum": ["utf-8", "base64"],
                    "default": "utf-8",
                    "description": "Content encoding: utf-8 for text files, base64 for binary files"
                }
            },
            "required": ["filepath", "content"],
            "additionalProperties": False
        },
        "execute": file_upload
    }
    
    async def file_download(filepath: str, encoding: str = "auto") -> Dict:
        """Download a file from the VM container"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {
            "filepath": filepath,
            "encoding": encoding  # "auto", "utf-8", or "base64"
        }
        result = await vm_control_service.execute_command(machine_id, "file_download", params)
        
        # Return the file content and metadata
        if result.get("success"):
            return {
                "success": True,
                "filename": result.get("filename"),
                "filepath": result.get("filepath"),
                "size": result.get("size"),
                "encoding": result.get("encoding"),
                "content": result.get("content"),
                "message": result.get("message")
            }
        return result
    
    tools["file_download"] = {
        "name": "file_download",
        "description": "Download a file from the VM desktop. Automatically detects if file is text or binary. Maximum file size is 10MB. Returns file content and metadata.",
        "parameters": {
            "type": "object",
            "properties": {
                "filepath": {
                    "type": "string",
                    "description": "Path to the file to download. Relative paths use Desktop as base."
                },
                "encoding": {
                    "type": "string",
                    "enum": ["auto", "utf-8", "base64"],
                    "default": "auto",
                    "description": "How to encode the file content: auto (detect), utf-8 (text), or base64 (binary)"
                }
            },
            "required": ["filepath"],
            "additionalProperties": False
        },
        "execute": file_download
    }
    
    async def file_list_downloads(dirpath: str = "", recursive: bool = False, max_files: int = 100) -> Dict:
        """List files available for download"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {
            "dirpath": dirpath or "/home/desktop/Desktop",
            "recursive": recursive,
            "max_files": max_files
        }
        return await vm_control_service.execute_command(machine_id, "file_list_downloads", params)
    
    tools["file_list_downloads"] = {
        "name": "file_list_downloads",
        "description": "List all files available for download in a directory. Shows file sizes, modification times, and whether they're downloadable (under 10MB). Useful for browsing VM files before downloading.",
        "parameters": {
            "type": "object",
            "properties": {
                "dirpath": {
                    "type": "string",
                    "description": "Directory path to list files from (defaults to Desktop)"
                },
                "recursive": {
                    "type": "boolean",
                    "default": False,
                    "description": "Whether to include files in subdirectories"
                },
                "max_files": {
                    "type": "integer",
                    "default": 100,
                    "minimum": 1,
                    "maximum": 1000,
                    "description": "Maximum number of files to list"
                }
            },
            "required": [],
            "additionalProperties": False
        },
        "execute": file_list_downloads
    }
    
    # Execute command tool (simplified background execution)
    async def execute_command(command: str) -> Dict:
        """Execute a shell command in background and return output"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        result = await vm_control_service.execute_command(machine_id, "execute_command", {"command": command})
        
        # Make output more accessible in the response
        if result.get("success") and "output" in result:
            # Format the response for better readability
            return {
                "success": True,
                "command": command,
                "output": result.get("output", ""),
                "error": result.get("error", ""),
                "exit_code": result.get("exit_code", 0)
            }
        
        return result
    
    tools["execute_command"] = {
        "name": "execute_command",
        "description": "⚠️ DEPRECATED - Use terminal_connect then terminal_execute instead. Quick shell command execution (runs in background, returns output). For interactive terminal use terminal_* tools.",
        "parameters": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"}
            },
            "required": ["command"]
        },
        "execute": execute_command
    }
    
    # ===================
    # WINDOW MANAGEMENT
    # ===================
    
    # List windows tool
    async def list_windows() -> Dict:
        """List all open windows"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "list_windows", {})
    
    tools["list_windows"] = {
        "name": "list_windows",
        "description": "List all open windows with their IDs and titles",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": list_windows
    }
    
    # Switch window tool
    async def switch_window(window: str) -> Dict:
        """Switch to a specific window by ID or title"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "switch_to_window", {"window": window})
    
    tools["switch_window"] = {
        "name": "switch_window",
        "description": "Switch to a window by ID (0x...) or title",
        "parameters": {
            "type": "object",
            "properties": {
                "window": {"type": "string", "description": "Window ID or title"}
            },
            "required": ["window"]
        },
        "execute": switch_window
    }
    
    # Arrange windows tool
    async def arrange_windows(arrangement: str = "tile") -> Dict:
        """Arrange windows on desktop"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "arrange_windows", {"arrangement": arrangement})
    
    tools["arrange_windows"] = {
        "name": "arrange_windows",
        "description": "Arrange windows on the desktop",
        "parameters": {
            "type": "object",
            "properties": {
                "arrangement": {
                    "type": "string",
                    "enum": ["tile", "cascade", "minimize_all", "show_desktop", "restore_all"],
                    "default": "tile",
                    "description": "How to arrange the windows"
                }
            },
            "required": []
        },
        "execute": arrange_windows
    }
    
    # Window operations tool
    async def window_operation(operation: str, window_title: Optional[str] = None) -> Dict:
        """Perform operations on windows"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        command_map = {
            "close": "close_window",
            "minimize": "minimize_window",
            "maximize": "maximize_window",
            "restore": "restore_window"
        }
        
        command = command_map.get(operation)
        if not command:
            return {"success": False, "error": f"Unknown operation: {operation}"}
        
        params = {}
        if window_title:
            params["window_title"] = window_title
        
        return await vm_control_service.execute_command(machine_id, command, params)
    
    tools["window_operation"] = {
        "name": "window_operation",
        "description": "Perform operations on windows (close, minimize, maximize, restore)",
        "parameters": {
            "type": "object",
            "properties": {
                "operation": {
                    "type": "string",
                    "enum": ["close", "minimize", "maximize", "restore"],
                    "description": "Operation to perform"
                },
                "window_title": {
                    "type": "string",
                    "description": "Window ID or title (optional, defaults to current window)"
                }
            },
            "required": ["operation"]
        },
        "execute": window_operation
    }
    
    # Move window tool
    async def move_window(
        x: int,
        y: int,
        width: Optional[int] = None,
        height: Optional[int] = None,
        window_title: Optional[str] = None
    ) -> Dict:
        """Move and optionally resize a window"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {"x": x, "y": y}
        if width:
            params["width"] = width
        if height:
            params["height"] = height
        if window_title:
            params["window_title"] = window_title
        
        return await vm_control_service.execute_command(machine_id, "move_window", params)
    
    tools["move_window"] = {
        "name": "move_window",
        "description": "Move and optionally resize a window",
        "parameters": {
            "type": "object",
            "properties": {
                "x": {"type": "integer", "description": "New X position"},
                "y": {"type": "integer", "description": "New Y position"},
                "width": {"type": "integer", "description": "New width (optional)"},
                "height": {"type": "integer", "description": "New height (optional)"},
                "window_title": {"type": "string", "description": "Window ID or title (optional)"}
            },
            "required": ["x", "y"]
        },
        "execute": move_window
    }
    
    # ====================
    # BROWSER AUTOMATION
    # ====================
    
    # Open browser tool
    async def browser_open() -> Dict:
        """Open Chrome browser and connect for automation"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_open", {})
    
    tools["browser_open"] = {
        "name": "browser_open",
        "description": "Open Chrome browser and connect it for automation",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": browser_open
    }
    
    # Connect to browser tool
    async def browser_connect() -> Dict:
        """Connect to existing Chrome browser"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_connect", {})
    
    tools["browser_connect"] = {
        "name": "browser_connect",
        "description": "Connect to an existing Chrome browser for automation",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": browser_connect
    }
    
    # Get browser DOM tool
    async def browser_get_dom(filter_text: Optional[str] = None) -> Dict:
        """
        Get DOM elements from current page
        
        Args:
            filter_text: Optional text to filter elements (e.g. "add to cart", "buy now")
        
        Returns:
            DOM structure with:
            - actionable_elements: Flat list of interactive elements with unique selectors
            - text_elements: Non-interactive text elements with selectors
            - selector_map: Quick lookup from element ID to selector
        """
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        result = await vm_control_service.execute_command(machine_id, "browser_get_dom", {})
        
        # If command failed, return the error
        if not result.get("success"):
            return result
        
        # Remove hierarchy to reduce bloat
        if "hierarchy" in result:
            del result["hierarchy"]

        # Filter out actionable elements without id
        if result.get("actionable_elements"):
            result["actionable_elements"] = [
                elem for elem in result["actionable_elements"]
                if elem.get("id") and elem["id"].strip()
            ]

        # Filter out text elements without id
        if result.get("text_elements"):
            result["text_elements"] = [
                elem for elem in result["text_elements"]
                if elem.get("id") and elem["id"].strip()
            ]

        # Apply filtering if requested
        if filter_text and result.get("success"):
            import re
            
            # Create regex pattern for flexible matching
            pattern_text = filter_text.replace(' ', r'\s*')
            try:
                pattern = re.compile(pattern_text, re.IGNORECASE)
            except re.error:
                pattern = None
            
            # Filter actionable elements
            filtered_actionable = []
            for elem in result.get('actionable_elements', []):
                elem_text = elem.get('text', '') + ' ' + elem.get('context', '')
                if pattern and pattern.search(elem_text):
                    filtered_actionable.append(elem)
                elif not pattern and filter_text.lower() in elem_text.lower():
                    filtered_actionable.append(elem)
            
            # Filter text elements  
            filtered_text = []
            for elem in result.get('text_elements', []):
                elem_text = elem.get('text', '') + ' ' + elem.get('context', '')
                if pattern and pattern.search(elem_text):
                    filtered_text.append(elem)
                elif not pattern and filter_text.lower() in elem_text.lower():
                    filtered_text.append(elem)
            
            # Update result with filtered lists
            if filtered_actionable or filtered_text:
                result['actionable_elements'] = filtered_actionable
                result['text_elements'] = filtered_text
                # Update selector_map to only include filtered elements
                if result.get('selector_map'):
                    filtered_ids = set()
                    for elem in filtered_actionable + filtered_text:
                        if elem.get('id'):
                            filtered_ids.add(elem['id'])
                    result['selector_map'] = {k: v for k, v in result['selector_map'].items() if k in filtered_ids}
        
        # Return the result without hierarchy
        return result
    
    tools["browser_dom"] = {
        "name": "browser_dom",
        "description": "Analyze the current web page DOM structure and return interactive elements with their CSS selectors. Always use filter_text parameter to efficiently find specific elements before falling back to full page scan.",
        "parameters": {
            "type": "object",
            "properties": {
                "filter_text": {
                    "type": "string",
                    "description": "Text to search for in element content or attributes. Start specific ('add to cart') then broaden if needed ('cart', 'add'). Examples: button text, link text, form labels."
                }
            },
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_get_dom
    }
    
    # Browser get clickables tool
    async def browser_get_clickables(filter_text: Optional[str] = None) -> Dict:
        """
        Get ALL clickable elements from current page
        
        Args:
            filter_text: Optional text to filter clickables (e.g. "submit", "next", "add to cart")
        
        Returns:
            List of clickable elements with:
            - type: Element type (button, link, input, select, etc.)
            - text: Visible text or label
            - selector: CSS selector to use with browser_click
            - xpath: XPath selector as alternative
            - context: Surrounding text for context
            - attributes: Key attributes like href, value, placeholder
        """
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        # Get clickable elements from the specialized backend function
        result = await vm_control_service.execute_command(machine_id, "browser_get_clickables", {})
        
        if not result.get("success"):
            return result
        
        # Apply text filter if provided
        if filter_text and result.get("clickables"):
            import re
            
            # Create regex pattern for flexible matching
            pattern_text = filter_text.replace(' ', r'\s*')
            try:
                pattern = re.compile(pattern_text, re.IGNORECASE)
            except re.error:
                pattern = None
            
            filtered_clickables = []
            for elem in result.get('clickables', []):
                # Search in text, context, and key attributes
                search_text = ' '.join([
                    elem.get('text', ''),
                    elem.get('context', ''),
                    elem.get('attributes', {}).get('aria-label', ''),
                    elem.get('attributes', {}).get('placeholder', ''),
                    elem.get('attributes', {}).get('title', ''),
                    elem.get('attributes', {}).get('value', ''),
                    elem.get('attributes', {}).get('href', '')
                ])
                
                if pattern and pattern.search(search_text):
                    filtered_clickables.append(elem)
                elif not pattern and filter_text.lower() in search_text.lower():
                    filtered_clickables.append(elem)
            
            result['clickables'] = filtered_clickables
            result['total'] = len(filtered_clickables)
        
        return result
    
    tools["browser_get_clickables"] = {
        "name": "browser_get_clickables",
        "description": "Get ALL clickable elements (buttons, links, inputs, selects, checkboxes, etc.) from the current page. Returns a focused list with selectors ready for browser_click. Use filter_text to find specific buttons/links (e.g., 'submit', 'next', 'add to cart'). Much more efficient than browser_dom for finding interactive elements.",
        "parameters": {
            "type": "object",
            "properties": {
                "filter_text": {
                    "type": "string", 
                    "description": "Optional text to filter clickables (searches in text, labels, placeholders)"
                }
            },
            "required": []
        },
        "execute": browser_get_clickables
    }
    
    # Browser form analyzer tool
    async def browser_analyze_form() -> Dict:
        """
        Analyze forms on the current page to understand their structure
        
        Returns:
            Structured analysis of all forms including:
            - Form fields with types and requirements
            - Field names, labels, placeholders
            - Submit buttons
            - Validation rules
        """
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        # Get all form elements
        result = await vm_control_service.execute_command(machine_id, "browser_get_clickables", {})
        
        if not result.get("success"):
            return result
        
        # Analyze form structure
        form_analysis = {
            "forms_found": 0,
            "form_fields": [],
            "submit_buttons": [],
            "required_fields": [],
            "field_types": {}
        }
        
        clickables = result.get("clickables", [])
        
        for elem in clickables:
            elem_type = elem.get("type", "")
            tag = elem.get("tag", "")
            attributes = elem.get("attributes", {})
            
            # Categorize form elements
            if tag == "input":
                field_info = {
                    "selector": elem.get("selector"),
                    "type": attributes.get("type", "text"),
                    "name": attributes.get("name"),
                    "placeholder": attributes.get("placeholder"),
                    "value": attributes.get("value"),
                    "required": "required" in str(attributes),
                    "label": elem.get("context", ""),
                    "id": attributes.get("id")
                }
                form_analysis["form_fields"].append(field_info)
                
                # Track field types
                field_type = attributes.get("type", "text")
                if field_type not in form_analysis["field_types"]:
                    form_analysis["field_types"][field_type] = []
                form_analysis["field_types"][field_type].append(field_info)
                
                # Track required fields
                if field_info["required"]:
                    form_analysis["required_fields"].append(field_info)
            
            elif tag == "select":
                field_info = {
                    "selector": elem.get("selector"),
                    "type": "select",
                    "name": attributes.get("name"),
                    "required": "required" in str(attributes),
                    "label": elem.get("context", ""),
                    "id": attributes.get("id")
                }
                form_analysis["form_fields"].append(field_info)
                
            elif tag == "textarea":
                field_info = {
                    "selector": elem.get("selector"),
                    "type": "textarea",
                    "name": attributes.get("name"),
                    "placeholder": attributes.get("placeholder"),
                    "required": "required" in str(attributes),
                    "label": elem.get("context", ""),
                    "id": attributes.get("id")
                }
                form_analysis["form_fields"].append(field_info)
                
            elif elem_type in ["submit", "button"] and any(word in elem.get("text", "").lower() 
                                                           for word in ["submit", "send", "save", "continue", "next", "apply", "search"]):
                form_analysis["submit_buttons"].append({
                    "selector": elem.get("selector"),
                    "text": elem.get("text"),
                    "type": elem_type
                })
        
        form_analysis["forms_found"] = 1 if form_analysis["form_fields"] else 0
        
        # Add filling recommendations
        recommendations = []
        for field in form_analysis["form_fields"]:
            field_type = field.get("type")
            field_name = field.get("name", "").lower()
            placeholder = field.get("placeholder", "").lower()
            
            # Generate smart recommendations
            if "email" in field_name or "email" in placeholder:
                recommendations.append(f"{field['selector']}: Use 'john.smith@email.com'")
            elif "name" in field_name and "first" in field_name:
                recommendations.append(f"{field['selector']}: Use 'John'")
            elif "name" in field_name and "last" in field_name:
                recommendations.append(f"{field['selector']}: Use 'Smith'")
            elif "phone" in field_name or "tel" in field_name:
                recommendations.append(f"{field['selector']}: Use '555-123-4567'")
            elif field_type == "password":
                recommendations.append(f"{field['selector']}: Use 'SecurePass123!'")
            elif field_type == "date":
                recommendations.append(f"{field['selector']}: Use today's date")
            elif field_type == "number":
                recommendations.append(f"{field['selector']}: Use '1' or appropriate number")
        
        form_analysis["filling_recommendations"] = recommendations
        
        return {
            "success": True,
            "form_analysis": form_analysis,
            "total_fields": len(form_analysis["form_fields"]),
            "total_required": len(form_analysis["required_fields"]),
            "has_submit": len(form_analysis["submit_buttons"]) > 0
        }
    
    tools["browser_analyze_form"] = {
        "name": "browser_analyze_form",
        "description": "Analyze forms on the current page to understand their structure. Returns detailed information about form fields, types, requirements, and smart filling recommendations. USE THIS BEFORE FILLING ANY FORM to understand what data is needed.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": browser_analyze_form
    }
    
    # Browser click tool
    async def browser_click(selector: str) -> Dict:
        """Click element in browser by selector"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_click", {"selector": selector})
    
    tools["browser_click"] = {
        "name": "browser_click",
        "description": "Click an element on the web page using its CSS selector or XPath. Returns comprehensive information about: the clicked element (position, text, ID), state changes (navigation, focus changes, scroll, alerts), and nearby elements for context. Use selectors obtained from browser_dom or browser_get_clickables for accuracy.",
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string", 
                    "description": "CSS selector (#id, .class, [attr=value]) or XPath (//element[@attr='value']) of the element to click"
                }
            },
            "required": ["selector"],
            "additionalProperties": False
        },
        "execute": browser_click
    }
    
    # Browser JavaScript form fill tool - ULTRA FAST
    async def browser_fill_form_js(form_data: Optional[Dict] = None, auto_detect: bool = True) -> Dict:
        """
        Fill entire form instantly using JavaScript - 10x faster than clicking
        
        Args:
            form_data: Optional dict with field selectors/names and values
            auto_detect: If True, automatically detect and fill common fields
        
        Returns:
            Success status and filled fields info
        """
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        # Default smart form data if not provided
        if not form_data:
            form_data = {}
        
        # Smart defaults for common fields
        default_values = {
            # Personal info
            "name": "John Smith",
            "firstname": "John", 
            "first_name": "John",
            "fname": "John",
            "lastname": "Smith",
            "last_name": "Smith",
            "lname": "Smith",
            "fullname": "John Smith",
            "full_name": "John Smith",
            
            # Contact
            "email": "john.smith@email.com",
            "e-mail": "john.smith@email.com",
            "mail": "john.smith@email.com",
            "phone": "555-123-4567",
            "tel": "555-123-4567",
            "mobile": "555-123-4567",
            
            # Address
            "address": "123 Main Street",
            "street": "123 Main Street",
            "address1": "123 Main Street",
            "address_1": "123 Main Street",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94102",
            "zipcode": "94102",
            "postal": "94102",
            "country": "United States",
            
            # Account
            "username": "user123",
            "password": "SecurePass123!",
            "confirm_password": "SecurePass123!",
            "passwordconfirm": "SecurePass123!",
            
            # Other
            "company": "Tech Corp",
            "website": "www.example.com",
            "age": "30",
            "quantity": "1"
        }
        
        # Merge defaults with provided data
        final_data = {**default_values, **form_data} if auto_detect else form_data
        
        # Build JavaScript to fill form
        js_code = """
        function ultraFillForm(formData) {
            let filledFields = [];
            let errors = [];
            
            // Method 1: Fill by name attribute
            for (let [key, value] of Object.entries(formData)) {
                // Try multiple selectors
                const selectors = [
                    `input[name="${key}"]`,
                    `input[name="${key.toLowerCase()}"]`,
                    `input[name="${key.replace('_', '-')}"]`,
                    `select[name="${key}"]`,
                    `textarea[name="${key}"]`,
                    `input[id="${key}"]`,
                    `input[id*="${key}"]`,
                    `input[placeholder*="${key}"]`
                ];
                
                let filled = false;
                for (let selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            elements.forEach(el => {
                                if (el.type === 'checkbox' || el.type === 'radio') {
                                    el.checked = true;
                                } else if (el.tagName === 'SELECT') {
                                    // Try to find matching option
                                    for (let option of el.options) {
                                        if (option.value.toLowerCase() === value.toLowerCase() ||
                                            option.text.toLowerCase() === value.toLowerCase()) {
                                            el.value = option.value;
                                            break;
                                        }
                                    }
                                    if (!el.value && el.options.length > 0) {
                                        el.value = el.options[0].value; // Default to first
                                    }
                                } else {
                                    el.value = value;
                                    // Trigger events for frameworks
                                    el.dispatchEvent(new Event('input', {bubbles: true}));
                                    el.dispatchEvent(new Event('change', {bubbles: true}));
                                }
                                filled = true;
                                filledFields.push({field: key, selector: selector, value: value});
                            });
                            if (filled) break;
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }
                
                if (!filled && formData[key]) {
                    errors.push(`Could not find field: ${key}`);
                }
            }
            
            // Method 2: Smart detection for common fields not in formData
            if (formData.auto_detect !== false) {
                // Auto-fill email fields
                document.querySelectorAll('input[type="email"]').forEach(el => {
                    if (!el.value) {
                        el.value = formData.email || 'john.smith@email.com';
                        filledFields.push({field: 'email', selector: 'input[type="email"]', value: el.value});
                    }
                });
                
                // Auto-fill password fields
                document.querySelectorAll('input[type="password"]').forEach(el => {
                    if (!el.value) {
                        el.value = formData.password || 'SecurePass123!';
                        filledFields.push({field: 'password', selector: 'input[type="password"]', value: el.value});
                    }
                });
                
                // Auto-fill name fields
                document.querySelectorAll('input[type="text"]').forEach(el => {
                    const nameLower = (el.name || '').toLowerCase();
                    const placeholderLower = (el.placeholder || '').toLowerCase();
                    
                    if (!el.value) {
                        if (nameLower.includes('name') || placeholderLower.includes('name')) {
                            if (nameLower.includes('first')) {
                                el.value = 'John';
                            } else if (nameLower.includes('last')) {
                                el.value = 'Smith';
                            } else {
                                el.value = 'John Smith';
                            }
                            filledFields.push({field: el.name, selector: `input[name="${el.name}"]`, value: el.value});
                        }
                    }
                });
            }
            
            // Method 3: Submit form if requested
            if (formData.auto_submit) {
                const submitButton = document.querySelector(
                    'button[type="submit"], input[type="submit"], button:contains("Submit"), button:contains("Continue")'
                );
                if (submitButton) {
                    submitButton.click();
                    filledFields.push({field: 'submit', action: 'clicked submit button'});
                }
            }
            
            return {
                success: filledFields.length > 0,
                filledFields: filledFields,
                totalFilled: filledFields.length,
                errors: errors,
                forms: document.querySelectorAll('form').length
            };
        }
        
        return ultraFillForm(""" + json.dumps(final_data) + """);
        """
        
        result = await vm_control_service.execute_command(machine_id, "browser_execute", {"script": js_code})
        
        if result.get("success"):
            fill_result = result.get("result", {})
            return {
                "success": True,
                "filled_fields": fill_result.get("filledFields", []),
                "total_filled": fill_result.get("totalFilled", 0),
                "errors": fill_result.get("errors", []),
                "message": f"Successfully filled {fill_result.get('totalFilled', 0)} fields"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Failed to execute form filling JavaScript")
            }
    
    tools["browser_fill_form_js"] = {
        "name": "browser_fill_form_js",
        "description": "⚡ ULTRA-FAST form filling using JavaScript injection. Fills entire forms instantly without clicking each field. 10x faster than traditional clicking. Automatically detects and fills common fields like name, email, address, etc. Use this INSTEAD of clicking and typing in each field separately.",
        "parameters": {
            "type": "object",
            "properties": {
                "form_data": {
                    "type": "object",
                    "description": "Optional custom field mappings {field_name: value}. If not provided, uses smart defaults for common fields.",
                    "additionalProperties": {"type": "string"}
                },
                "auto_detect": {
                    "type": "boolean",
                    "default": True,
                    "description": "Automatically detect and fill common fields with smart defaults"
                }
            },
            "required": []
        },
        "execute": browser_fill_form_js
    }
    
    # Browser type tool
    async def browser_type(selector: str, text: str, clear: bool = True) -> Dict:
        """Type text in browser element"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {"selector": selector, "text": text, "clear": clear}
        return await vm_control_service.execute_command(machine_id, "browser_type", params)
    
    tools["browser_type"] = {
        "name": "browser_type",
        "description": "Type text into a browser element",
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {"type": "string", "description": "CSS selector of input element"},
                "text": {"type": "string", "description": "Text to type"},
                "clear": {"type": "boolean", "default": True, "description": "Clear existing text first"}
            },
            "required": ["selector", "text"]
        },
        "execute": browser_type
    }
    
    # Browser navigate tool
    async def browser_navigate(url: str) -> Dict:
        """Navigate browser to URL"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_navigate", {"url": url})
    
    tools["browser_navigate"] = {
        "name": "browser_navigate",
        "description": "Navigate the browser to a specified URL. Wait for page load to complete before interacting with page elements.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string", 
                    "format": "uri",
                    "description": "Complete URL including protocol (http:// or https://). Example: 'https://www.example.com'"
                }
            },
            "required": ["url"],
            "additionalProperties": False
        },
        "execute": browser_navigate
    }
    
    # Browser info tool
    async def browser_info() -> Dict:
        """Get browser information"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_info", {})
    
    tools["browser_info"] = {
        "name": "browser_info",
        "description": "Get information about the current browser state",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        },
        "execute": browser_info
    }
    
    # Browser state tool - comprehensive state tracking
    async def browser_state() -> Dict:
        """Get comprehensive browser state including focus, cursor, scroll, and interaction state"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        result = await vm_control_service.execute_command(machine_id, "browser_state", {})
        return filter_screenshot_for_model(result)
    
    tools["browser_state"] = {
        "name": "browser_state",
        "description": "Get comprehensive browser state including: active/focused element details (where cursor/focus is), mouse position, scroll position, forms on page, interactive elements count, loading indicators, and alerts. This provides complete situational awareness of the browser's current state.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_state
    }
    
    # Browser context tool - AI-friendly context
    async def browser_get_context() -> Dict:
        """Get AI-friendly context about the current page and interaction state"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        result = await vm_control_service.execute_command(machine_id, "browser_get_context", {})
        return filter_screenshot_for_model(result)
    
    tools["browser_get_context"] = {
        "name": "browser_get_context",
        "description": "Get AI-friendly context about the current page including: page type detection (login/search/e-commerce), visible text near viewport, actionable elements in view, focused element details, and a human-readable summary. Use this to understand what kind of page you're on and what actions are available.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_get_context
    }
    
    # ======================
    # BROWSER TAB MANAGEMENT
    # ======================
    
    # List tabs tool
    async def browser_list_tabs() -> Dict:
        """List all open browser tabs"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_list_tabs", {})
    
    tools["browser_list_tabs"] = {
        "name": "browser_list_tabs",
        "description": "List all open tabs in the browser with their URLs, titles, and current tab indicator",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_list_tabs
    }
    
    # Open new tab tool
    async def browser_open_tab(url: Optional[str] = None) -> Dict:
        """Open a new browser tab"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {}
        if url:
            params["url"] = url
        
        return await vm_control_service.execute_command(machine_id, "browser_open_tab", params)
    
    tools["browser_open_tab"] = {
        "name": "browser_open_tab",
        "description": "Open a new browser tab. Can optionally navigate to a URL immediately.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "format": "uri",
                    "description": "Optional URL to navigate to in the new tab. If not provided, opens a blank tab."
                }
            },
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_open_tab
    }
    
    # Close tab tool
    async def browser_close_tab(tab_index: Optional[int] = None) -> Dict:
        """Close a browser tab"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {}
        if tab_index is not None:
            params["tab_index"] = tab_index
        
        return await vm_control_service.execute_command(machine_id, "browser_close_tab", params)
    
    tools["browser_close_tab"] = {
        "name": "browser_close_tab",
        "description": "Close a browser tab by index. If no index provided, closes the current tab. Cannot close the last remaining tab.",
        "parameters": {
            "type": "object",
            "properties": {
                "tab_index": {
                    "type": "integer",
                    "minimum": 0,
                    "description": "Zero-based index of the tab to close. If not provided, closes current tab."
                }
            },
            "required": [],
            "additionalProperties": False
        },
        "execute": browser_close_tab
    }
    
    # Switch tab tool
    async def browser_switch_tab(tab_index: int) -> Dict:
        """Switch to a specific browser tab"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_switch_tab", {"tab_index": tab_index})
    
    tools["browser_switch_tab"] = {
        "name": "browser_switch_tab",
        "description": "Switch to a specific browser tab by its index",
        "parameters": {
            "type": "object",
            "properties": {
                "tab_index": {
                    "type": "integer",
                    "minimum": 0,
                    "description": "Zero-based index of the tab to switch to. Use browser_list_tabs to see available tabs and their indices."
                }
            },
            "required": ["tab_index"],
            "additionalProperties": False
        },
        "execute": browser_switch_tab
    }
    
    # Browser execute script tool
    async def browser_execute(script: str) -> Dict:
        """Execute JavaScript in browser"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        return await vm_control_service.execute_command(machine_id, "browser_execute", {"script": script})
    
    tools["browser_execute"] = {
        "name": "browser_execute",
        "description": "Execute JavaScript code in the browser context",
        "parameters": {
            "type": "object",
            "properties": {
                "script": {"type": "string", "description": "JavaScript code to execute"}
            },
            "required": ["script"]
        },
        "execute": browser_execute
    }
    
    # Browser screenshot tool
    async def browser_screenshot(selector: Optional[str] = None) -> Dict:
        """Take screenshot of browser or specific element"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {}
        if selector:
            params["selector"] = selector
        
        return await vm_control_service.execute_command(machine_id, "browser_screenshot", params)
    
    tools["browser_screenshot"] = {
        "name": "browser_screenshot",
        "description": "Take a screenshot of the browser or specific element",
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {"type": "string", "description": "CSS selector of element to screenshot (optional)"}
            },
            "required": []
        },
        "execute": browser_screenshot
    }
    
    # Browser scroll tool
    async def browser_scroll(direction: str = "down", amount: int = 500) -> Dict:
        """Scroll the browser page to reveal more content"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {"direction": direction, "amount": amount}
        return await vm_control_service.execute_command(machine_id, "browser_scroll", params)
    
    tools["browser_scroll"] = {
        "name": "browser_scroll",
        "description": "Scroll the browser page to reveal hidden content, lazy-loaded elements, and items below the fold. CRITICAL for finding elements that aren't immediately visible. Use multiple times to reach page bottom.",
        "parameters": {
            "type": "object",
            "properties": {
                "direction": {
                    "type": "string",
                    "enum": ["up", "down", "left", "right"],
                    "default": "down",
                    "description": "Direction to scroll"
                },
                "amount": {
                    "type": "integer",
                    "default": 500,
                    "description": "Pixels to scroll (use larger values for faster scrolling)"
                }
            },
            "required": []
        },
        "execute": browser_scroll
    }
    
    # Browser wait tool
    async def browser_wait(selector: str, timeout: int = 5000) -> Dict:
        """Wait for element to appear in browser"""
        if not await ensure_connection():
            return {"success": False, "error": "Cannot connect to VM agent"}
        
        params = {"selector": selector, "timeout": timeout}
        return await vm_control_service.execute_command(machine_id, "browser_wait", params)
    
    tools["browser_wait"] = {
        "name": "browser_wait",
        "description": "Wait for an element to appear in the browser",
        "parameters": {
            "type": "object",
            "properties": {
                "selector": {"type": "string", "description": "CSS selector to wait for"},
                "timeout": {"type": "integer", "default": 5000, "description": "Timeout in milliseconds"}
            },
            "required": ["selector"]
        },
        "execute": browser_wait
    }
    
    return tools