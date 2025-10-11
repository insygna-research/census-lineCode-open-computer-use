"""
Message optimization service for handling ultra-large messages
Provides chunking, compression, and reliable storage strategies
"""

import logging
import json
import gzip
import base64
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import asyncio
from dataclasses import dataclass
from app.utils.content_sanitizer import ContentSanitizer

logger = logging.getLogger(__name__)


@dataclass
class MessageChunk:
    """Represents a chunk of a large message"""
    chunk_id: str
    parent_message_id: str
    chunk_index: int
    total_chunks: int
    content: str
    is_compressed: bool
    original_size: int
    compressed_size: int


class MessageOptimizer:
    """Service for optimizing and chunking large messages for reliable storage"""
    
    # Size thresholds
    OPTIMAL_CHUNK_SIZE = 500_000  # 500KB per chunk (safe for most DBs)
    MAX_INLINE_SIZE = 100_000     # 100KB - inline storage threshold
    COMPRESSION_THRESHOLD = 10_000 # Compress anything over 10KB
    
    # Compression settings
    COMPRESSION_LEVEL = 6  # Balance between speed and compression ratio
    
    @staticmethod
    def should_compress(content: str) -> bool:
        """Determine if content should be compressed"""
        return len(content) > MessageOptimizer.COMPRESSION_THRESHOLD
    
    @staticmethod
    def compress_content(content: str) -> Tuple[str, int, int]:
        """
        Compress content using gzip and base64 encode it
        
        Returns:
            Tuple of (compressed_content, original_size, compressed_size)
        """
        try:
            # Sanitize content before compression to avoid issues
            content = ContentSanitizer.sanitize_content(content)
            original_size = len(content)
            
            # Compress using gzip
            compressed_bytes = gzip.compress(
                content.encode('utf-8'), 
                compresslevel=MessageOptimizer.COMPRESSION_LEVEL
            )
            
            # Base64 encode for storage
            compressed_b64 = base64.b64encode(compressed_bytes).decode('utf-8')
            compressed_size = len(compressed_b64)
            
            # Only use compression if it actually reduces size
            if compressed_size < original_size * 0.9:  # At least 10% reduction
                logger.info(f"Content compressed: {original_size:,} -> {compressed_size:,} bytes "
                          f"({(1 - compressed_size/original_size)*100:.1f}% reduction)")
                return compressed_b64, original_size, compressed_size
            else:
                logger.debug(f"Compression not beneficial, keeping original")
                return content, original_size, original_size
                
        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            return content, len(content), len(content)
    
    @staticmethod
    def decompress_content(compressed_content: str) -> str:
        """Decompress gzip+base64 encoded content"""
        try:
            compressed_bytes = base64.b64decode(compressed_content)
            decompressed = gzip.decompress(compressed_bytes).decode('utf-8')
            return decompressed
        except Exception as e:
            logger.error(f"Decompression failed: {str(e)}")
            return compressed_content  # Return as-is if not compressed
    
    @staticmethod
    def generate_chunk_id(parent_id: str, chunk_index: int) -> str:
        """Generate a unique chunk ID"""
        hash_input = f"{parent_id}_{chunk_index}_{datetime.utcnow().isoformat()}"
        return hashlib.md5(hash_input.encode()).hexdigest()
    
    @staticmethod
    def chunk_content(
        content: str,
        parent_message_id: str,
        chunk_size: int = None
    ) -> List[MessageChunk]:
        """
        Split large content into manageable chunks
        
        Args:
            content: The content to chunk
            parent_message_id: ID of the parent message
            chunk_size: Size of each chunk (defaults to OPTIMAL_CHUNK_SIZE)
            
        Returns:
            List of MessageChunk objects
        """
        if chunk_size is None:
            chunk_size = MessageOptimizer.OPTIMAL_CHUNK_SIZE
        
        # Sanitize content before chunking
        content = ContentSanitizer.sanitize_content(content)
        
        chunks = []
        total_length = len(content)
        
        # Calculate number of chunks needed
        num_chunks = (total_length + chunk_size - 1) // chunk_size
        
        logger.info(f"Chunking {total_length:,} bytes into {num_chunks} chunks of ~{chunk_size:,} bytes")
        
        for i in range(num_chunks):
            start = i * chunk_size
            end = min(start + chunk_size, total_length)
            chunk_content = content[start:end]
            
            # Compress each chunk if beneficial
            compressed, orig_size, comp_size = MessageOptimizer.compress_content(chunk_content)
            is_compressed = comp_size < orig_size * 0.9
            
            chunk = MessageChunk(
                chunk_id=MessageOptimizer.generate_chunk_id(parent_message_id, i),
                parent_message_id=parent_message_id,
                chunk_index=i,
                total_chunks=num_chunks,
                content=compressed if is_compressed else chunk_content,
                is_compressed=is_compressed,
                original_size=orig_size,
                compressed_size=comp_size if is_compressed else orig_size
            )
            chunks.append(chunk)
            
            logger.debug(f"Created chunk {i+1}/{num_chunks}: "
                        f"{orig_size:,} bytes -> {comp_size if is_compressed else orig_size:,} bytes")
        
        return chunks
    
    @staticmethod
    def optimize_message_parts(message_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Optimize message parts (tool invocations) for storage
        
        Handles:
        - Screenshot extraction and compression
        - Large result data optimization
        - JSON structure optimization
        """
        optimized = message_data.copy()
        
        if "parts" in optimized and isinstance(optimized["parts"], list):
            optimized_parts = []
            
            for part in optimized["parts"]:
                if not isinstance(part, dict):
                    optimized_parts.append(part)
                    continue
                
                # Handle tool invocation parts
                if part.get("type") == "tool-invocation" and "toolInvocation" in part:
                    tool_inv = part["toolInvocation"]
                    
                    # Check for screenshots in results
                    if "result" in tool_inv and isinstance(tool_inv["result"], dict):
                        result = tool_inv["result"]
                        
                        # Handle frontend screenshots
                        if "frontendScreenshot" in result:
                            screenshot = result["frontendScreenshot"]
                            screenshot_size = len(screenshot) if isinstance(screenshot, str) else 0
                            
                            if screenshot_size > MessageOptimizer.MAX_INLINE_SIZE:
                                # Extract screenshot and store reference
                                logger.info(f"Extracting large screenshot ({screenshot_size:,} bytes) from tool result")
                                
                                # Create a reference instead of inline data
                                result["screenshot_ref"] = {
                                    "type": "extracted",
                                    "size": screenshot_size,
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                                # Remove the inline screenshot
                                del result["frontendScreenshot"]
                        
                        # Compress large text results
                        for key, value in list(result.items()):
                            if isinstance(value, str) and len(value) > MessageOptimizer.COMPRESSION_THRESHOLD:
                                compressed, orig_size, comp_size = MessageOptimizer.compress_content(value)
                                if comp_size < orig_size * 0.9:
                                    result[f"{key}_compressed"] = {
                                        "data": compressed,
                                        "original_size": orig_size,
                                        "compressed_size": comp_size,
                                        "is_compressed": True
                                    }
                                    del result[key]
                    
                    # Optimize args if they're large
                    if "args" in tool_inv and isinstance(tool_inv["args"], dict):
                        args_str = json.dumps(tool_inv["args"])
                        if len(args_str) > MessageOptimizer.COMPRESSION_THRESHOLD:
                            compressed, orig_size, comp_size = MessageOptimizer.compress_content(args_str)
                            if comp_size < orig_size * 0.9:
                                tool_inv["args_compressed"] = compressed
                                tool_inv["args"] = {"__compressed": True}
                
                optimized_parts.append(part)
            
            optimized["parts"] = optimized_parts
        
        return optimized
    
    @staticmethod
    async def prepare_for_storage(message_data: Dict[str, Any]) -> Tuple[Dict[str, Any], Optional[List[MessageChunk]]]:
        """
        Prepare a message for storage, handling ultra-large content
        
        Returns:
            Tuple of (optimized_message, chunks_if_needed)
        """
        # Create a copy to avoid modifying original
        prepared = message_data.copy()
        chunks = None
        
        # Handle content field
        content = prepared.get("content", "")
        if isinstance(content, str):
            content_size = len(content)
            
            if content_size > MessageOptimizer.OPTIMAL_CHUNK_SIZE * 2:
                # Very large content - use chunking strategy
                logger.warning(f"Ultra-large content detected ({content_size:,} bytes), using chunking strategy")
                
                # Generate a message ID if not present
                message_id = prepared.get("id") or hashlib.md5(
                    f"{prepared.get('chat_id')}_{datetime.utcnow().isoformat()}".encode()
                ).hexdigest()
                
                # Create chunks
                chunks = MessageOptimizer.chunk_content(content, message_id)
                
                # Replace content with metadata
                prepared["content"] = json.dumps({
                    "__chunked": True,
                    "message_id": message_id,
                    "total_chunks": len(chunks),
                    "original_size": content_size,
                    "chunk_ids": [c.chunk_id for c in chunks],
                    "summary": content[:500] + "..." if len(content) > 500 else content
                })
                prepared["is_chunked"] = True
                
            elif content_size > MessageOptimizer.COMPRESSION_THRESHOLD:
                # Medium-large content - compress in place
                compressed, orig_size, comp_size = MessageOptimizer.compress_content(content)
                if comp_size < orig_size * 0.9:
                    prepared["content"] = json.dumps({
                        "__compressed": True,
                        "data": compressed,
                        "original_size": orig_size,
                        "compressed_size": comp_size
                    })
                    prepared["is_compressed"] = True
                    logger.info(f"Content compressed inline: {orig_size:,} -> {comp_size:,} bytes")
        
        # Optimize message parts (tool invocations)
        prepared = MessageOptimizer.optimize_message_parts(prepared)
        
        return prepared, chunks
    
    @staticmethod
    async def store_chunks(chunks: List[MessageChunk], db_service) -> bool:
        """
        Store message chunks in the database
        
        Uses parallel storage with retry logic for reliability
        """
        if not chunks:
            return True
        
        logger.info(f"Storing {len(chunks)} message chunks")
        
        # Store chunks in parallel for speed
        tasks = []
        for chunk in chunks:
            chunk_data = {
                "id": chunk.chunk_id,
                "parent_message_id": chunk.parent_message_id,
                "chunk_index": chunk.chunk_index,
                "total_chunks": chunk.total_chunks,
                "content": chunk.content,
                "is_compressed": chunk.is_compressed,
                "original_size": chunk.original_size,
                "compressed_size": chunk.compressed_size,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Create async task for storing each chunk
            task = db_service.store_message_chunk(chunk_data)
            tasks.append(task)
        
        # Wait for all chunks to be stored
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Check for failures
            failed_chunks = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to store chunk {chunks[i].chunk_index}: {str(result)}")
                    failed_chunks.append(i)
            
            if failed_chunks:
                logger.error(f"Failed to store {len(failed_chunks)} chunks: {failed_chunks}")
                
                # Retry failed chunks with longer timeout
                retry_tasks = []
                for idx in failed_chunks:
                    chunk = chunks[idx]
                    chunk_data = {
                        "id": chunk.chunk_id,
                        "parent_message_id": chunk.parent_message_id,
                        "chunk_index": chunk.chunk_index,
                        "total_chunks": chunk.total_chunks,
                        "content": chunk.content,
                        "is_compressed": chunk.is_compressed,
                        "original_size": chunk.original_size,
                        "compressed_size": chunk.compressed_size,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    retry_tasks.append(db_service.store_message_chunk(chunk_data, timeout=60))
                
                if retry_tasks:
                    retry_results = await asyncio.gather(*retry_tasks, return_exceptions=True)
                    final_failures = sum(1 for r in retry_results if isinstance(r, Exception))
                    
                    if final_failures > 0:
                        logger.error(f"Still failed to store {final_failures} chunks after retry")
                        return False
            
            logger.info(f"Successfully stored all {len(chunks)} chunks")
            return True
            
        except Exception as e:
            logger.error(f"Error storing chunks: {str(e)}")
            return False
    
    @staticmethod
    async def reconstruct_from_chunks(parent_message_id: str, db_service) -> Optional[str]:
        """
        Reconstruct original content from stored chunks
        """
        try:
            # Fetch all chunks for the parent message
            chunks = await db_service.get_message_chunks(parent_message_id)
            
            if not chunks:
                logger.error(f"No chunks found for message {parent_message_id}")
                return None
            
            # Sort by chunk index
            chunks.sort(key=lambda x: x.get("chunk_index", 0))
            
            # Reconstruct content
            reconstructed = []
            for chunk in chunks:
                content = chunk.get("content", "")
                
                # Decompress if needed
                if chunk.get("is_compressed"):
                    content = MessageOptimizer.decompress_content(content)
                
                reconstructed.append(content)
            
            full_content = "".join(reconstructed)
            logger.info(f"Reconstructed {len(full_content):,} bytes from {len(chunks)} chunks")
            
            return full_content
            
        except Exception as e:
            logger.error(f"Failed to reconstruct from chunks: {str(e)}")
            return None