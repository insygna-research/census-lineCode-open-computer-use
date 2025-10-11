"""
Content sanitizer for cleaning text before database storage
Handles null bytes, invalid Unicode sequences, and other problematic characters
"""

import re
import logging
from typing import Optional, Any, Dict, List
import json
import unicodedata

logger = logging.getLogger(__name__)


class ContentSanitizer:
    """Sanitize content to ensure database compatibility"""
    
    # Characters that should be removed or replaced
    NULL_BYTE = '\x00'
    REPLACEMENT_CHAR = '\ufffd'  # Unicode replacement character
    
    # Regex patterns for problematic sequences
    NULL_BYTE_PATTERN = re.compile(r'[\x00]')
    CONTROL_CHAR_PATTERN = re.compile(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]')
    INVALID_UNICODE_PATTERN = re.compile(r'\\u0000|\\x00')
    
    @staticmethod
    def remove_null_bytes(text: str) -> str:
        """Remove null bytes from text"""
        if not text:
            return text
        
        # Remove actual null bytes
        text = text.replace('\x00', '')
        text = text.replace('\u0000', '')
        
        # Remove escaped null byte sequences
        text = text.replace('\\u0000', '')
        text = text.replace('\\x00', '')
        
        return text
    
    @staticmethod
    def clean_control_characters(text: str, keep_newlines: bool = True) -> str:
        """Remove or replace control characters"""
        if not text:
            return text
        
        # Build a translation table for control characters
        control_chars = dict.fromkeys(range(0, 32), None)
        
        if keep_newlines:
            # Keep common whitespace characters
            control_chars[ord('\t')] = '\t'  # Tab
            control_chars[ord('\n')] = '\n'  # Newline
            control_chars[ord('\r')] = '\r'  # Carriage return
        
        # Remove control characters
        text = text.translate(control_chars)
        
        # Also remove DEL character (127)
        text = text.replace('\x7F', '')
        
        return text
    
    @staticmethod
    def normalize_unicode(text: str) -> str:
        """Normalize Unicode to prevent encoding issues"""
        if not text:
            return text
        
        try:
            # Normalize to NFC (Canonical Decomposition, followed by Canonical Composition)
            text = unicodedata.normalize('NFC', text)
            
            # Replace any remaining non-printable characters
            cleaned = []
            for char in text:
                if unicodedata.category(char)[0] in ('C', 'Z'):
                    # Control or separator character
                    if char in ('\t', '\n', '\r', ' '):
                        cleaned.append(char)  # Keep common whitespace
                    # Skip other control characters
                else:
                    cleaned.append(char)
            
            return ''.join(cleaned)
        except Exception as e:
            logger.warning(f"Unicode normalization failed: {e}")
            return text
    
    @staticmethod
    def sanitize_content(content: Any, deep: bool = True) -> Any:
        """
        Sanitize content for database storage
        
        Args:
            content: The content to sanitize (string, dict, list, or other)
            deep: Whether to recursively sanitize nested structures
            
        Returns:
            Sanitized content in the same format as input
        """
        if content is None:
            return None
        
        # Handle strings
        if isinstance(content, str):
            # Remove null bytes first
            content = ContentSanitizer.remove_null_bytes(content)
            
            # Clean control characters
            content = ContentSanitizer.clean_control_characters(content)
            
            # Normalize Unicode
            content = ContentSanitizer.normalize_unicode(content)
            
            # Final safety check - encode and decode to ensure it's valid UTF-8
            try:
                content = content.encode('utf-8', errors='replace').decode('utf-8')
            except Exception as e:
                logger.warning(f"UTF-8 encoding check failed: {e}")
                # Replace with safe placeholder
                content = "[Content sanitized due to encoding issues]"
            
            return content
        
        # Handle dictionaries
        if isinstance(content, dict) and deep:
            sanitized_dict = {}
            for key, value in content.items():
                # Sanitize both keys and values
                sanitized_key = ContentSanitizer.sanitize_content(key, deep=True) if isinstance(key, str) else key
                sanitized_value = ContentSanitizer.sanitize_content(value, deep=True)
                sanitized_dict[sanitized_key] = sanitized_value
            return sanitized_dict
        
        # Handle lists
        if isinstance(content, list) and deep:
            return [ContentSanitizer.sanitize_content(item, deep=True) for item in content]
        
        # Return other types as-is
        return content
    
    @staticmethod
    def sanitize_message_data(message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Specialized sanitization for message data
        
        Args:
            message_data: The message dictionary to sanitize
            
        Returns:
            Sanitized message data
        """
        if not message_data:
            return message_data
        
        # Create a copy to avoid modifying the original
        sanitized = message_data.copy()
        
        # Sanitize content field
        if 'content' in sanitized:
            original_content = sanitized['content']
            sanitized['content'] = ContentSanitizer.sanitize_content(original_content)
            
            # Log if content was changed
            if isinstance(original_content, str) and original_content != sanitized['content']:
                logger.info(f"Content sanitized: {len(original_content)} -> {len(sanitized['content'])} chars")
        
        # Sanitize parts (tool invocations)
        if 'parts' in sanitized and isinstance(sanitized['parts'], list):
            sanitized['parts'] = ContentSanitizer.sanitize_content(sanitized['parts'], deep=True)
        
        # Sanitize experimental_attachments
        if 'experimental_attachments' in sanitized:
            sanitized['experimental_attachments'] = ContentSanitizer.sanitize_content(
                sanitized['experimental_attachments'], 
                deep=True
            )
        
        # Sanitize any JSON fields that might be stored as strings
        for field in ['parts', 'tool_invocations', 'attachments']:
            if field in sanitized and isinstance(sanitized[field], str):
                try:
                    # Parse JSON, sanitize, and re-encode
                    parsed = json.loads(sanitized[field])
                    sanitized_parsed = ContentSanitizer.sanitize_content(parsed, deep=True)
                    sanitized[field] = json.dumps(sanitized_parsed)
                except (json.JSONDecodeError, TypeError):
                    # If it's not valid JSON, just sanitize as string
                    sanitized[field] = ContentSanitizer.sanitize_content(sanitized[field])
        
        return sanitized
    
    @staticmethod
    def validate_for_postgres(text: str) -> tuple[bool, Optional[str]]:
        """
        Validate that text is safe for PostgreSQL storage
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not text:
            return True, None
        
        # Check for null bytes
        if '\x00' in text or '\u0000' in text:
            return False, "Content contains null bytes"
        
        # Check for escaped null sequences that might cause issues
        if '\\u0000' in text or '\\x00' in text:
            return False, "Content contains escaped null byte sequences"
        
        # Try to encode as UTF-8
        try:
            text.encode('utf-8')
        except UnicodeEncodeError as e:
            return False, f"Content contains invalid Unicode: {e}"
        
        return True, None