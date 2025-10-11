import { useMemo } from "react"

export interface ParsedFileAttachment {
  name: string
  vmPath: string
  size?: number // File size in bytes
}

export interface ParsedMessage {
  content: string
  fileAttachments: ParsedFileAttachment[]
}

/**
 * Parse message content to extract file attachment tags
 * Tags format: <file-attachment name="filename.txt" path="/home/desktop/Desktop/filename.txt" size="1024" />
 * Also handles malformed nested tags and optional size attribute
 */
export function parseMessageContent(content: string): ParsedMessage {
  const fileAttachments: ParsedFileAttachment[] = []
  
  // Enhanced regex patterns to capture optional size attribute
  // Pattern 1: Self-closing tags with all attributes in any order
  const selfClosingRegex = /<file-attachment\s+(?:(?:name="([^"]+)"|path="([^"]+)"|size="(\d+)")\s*)+\/>/g
  
  // Pattern 2: Opening tags (handles malformed nested tags) with all attributes
  const openingTagRegex = /<file-attachment\s+(?:(?:name="([^"]+)"|path="([^"]+)"|size="(\d+)")\s*)+>/g
  
  // Helper function to extract attributes from a tag
  const extractAttributes = (tagString: string) => {
    const nameMatch = tagString.match(/name="([^"]+)"/)
    const pathMatch = tagString.match(/path="([^"]+)"/)
    const sizeMatch = tagString.match(/size="(\d+)"/)
    
    return {
      name: nameMatch ? nameMatch[1] : '',
      path: pathMatch ? pathMatch[1] : '',
      size: sizeMatch ? parseInt(sizeMatch[1], 10) : undefined
    }
  }
  
  // Track all matches to remove from content
  const allMatches: string[] = []
  const processedFiles = new Set<string>() // Track processed files by name+path
  
  // Find all file-attachment tags (both self-closing and opening)
  const allTagsRegex = /<file-attachment\s+[^>]+(?:\/)?>/g
  let match
  
  while ((match = allTagsRegex.exec(content)) !== null) {
    const tagString = match[0]
    allMatches.push(tagString)
    
    const attrs = extractAttributes(tagString)
    
    // Only add if we have both name and path
    if (attrs.name && attrs.path) {
      const fileKey = `${attrs.name}:${attrs.path}`
      
      // Avoid duplicates
      if (!processedFiles.has(fileKey)) {
        processedFiles.add(fileKey)
        fileAttachments.push({
          name: attrs.name,
          vmPath: attrs.path,
          size: attrs.size
        })
      }
    }
  }
  
  // Remove all file-attachment tags and their content
  let cleanContent = content
  
  // Remove self-closing tags
  cleanContent = cleanContent.replace(/<file-attachment\s+[^>]+\/>/g, '')
  
  // Remove malformed nested tags and their content
  cleanContent = cleanContent.replace(/<file-attachment\s+[^>]+>[\s\S]*?<\/file-attachment>/g, '')
  
  // Remove any remaining opening tags without closing tags
  cleanContent = cleanContent.replace(/<file-attachment\s+[^>]+>/g, '')
  
  // Remove any stray closing tags
  cleanContent = cleanContent.replace(/<\/file-attachment>/g, '')
  
  // Clean up extra whitespace
  cleanContent = cleanContent.trim()
  
  return {
    content: cleanContent,
    fileAttachments
  }
}

/**
 * Hook to parse message content with memoization
 */
export function useMessageParser(content: string) {
  return useMemo(() => parseMessageContent(content), [content])
}