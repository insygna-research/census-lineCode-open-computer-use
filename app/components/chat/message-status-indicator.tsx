import { cn } from "@/lib/utils"
import { 
  Database, 
  FileArchive, 
  Warning,
  CircleNotch,
  CheckCircle
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MessageStatusIndicatorProps {
  isChunked?: boolean | null
  isCompressed?: boolean | null
  truncated?: boolean | null
  contentSize?: number
  isLoading?: boolean
  className?: string
}

export function MessageStatusIndicator({
  isChunked,
  isCompressed,
  truncated,
  contentSize,
  isLoading,
  className
}: MessageStatusIndicatorProps) {
  // Don't show anything if there's no special status
  if (!isChunked && !isCompressed && !truncated && !isLoading) {
    return null
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        {isLoading && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 text-xs">
                <CircleNotch className="size-3 animate-spin" />
                Loading
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reconstructing large message content...</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isChunked && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-xs">
                <Database className="size-3" />
                Chunked
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This message was split into chunks for storage</p>
              {contentSize && <p className="text-xs text-muted-foreground">Size: {formatSize(contentSize)}</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {isCompressed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-xs">
                <FileArchive className="size-3" />
                Compressed
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This message was compressed for efficient storage</p>
              {contentSize && <p className="text-xs text-muted-foreground">Original: {formatSize(contentSize)}</p>}
            </TooltipContent>
          </Tooltip>
        )}

        {truncated && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="gap-1 text-xs">
                <Warning className="size-3" />
                Truncated
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-yellow-600 dark:text-yellow-400">
                This message was truncated due to size limits
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Some content may be missing
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  )
}

export function MessageOptimizationStats({
  originalSize,
  compressedSize,
  chunks,
  className
}: {
  originalSize?: number
  compressedSize?: number
  chunks?: number
  className?: string
}) {
  if (!originalSize && !chunks) return null

  const compressionRatio = originalSize && compressedSize 
    ? ((1 - compressedSize / originalSize) * 100).toFixed(1)
    : null

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      {originalSize && (
        <div className="flex items-center gap-1">
          <CheckCircle className="size-3 text-green-600 dark:text-green-400" />
          <span>
            Optimized: {formatSize(originalSize)}
            {compressedSize && (
              <>
                {" → "}
                {formatSize(compressedSize)}
                {compressionRatio && (
                  <span className="text-green-600 dark:text-green-400 ml-1">
                    (-{compressionRatio}%)
                  </span>
                )}
              </>
            )}
          </span>
        </div>
      )}
      {chunks && chunks > 1 && (
        <div className="flex items-center gap-1">
          <Database className="size-3" />
          <span>{chunks} chunks</span>
        </div>
      )}
    </div>
  )
}