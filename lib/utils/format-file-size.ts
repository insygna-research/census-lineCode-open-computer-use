/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) {
    return ''
  }

  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  // Ensure we don't go beyond our units array
  const unitIndex = Math.min(i, units.length - 1)
  const size = bytes / Math.pow(k, unitIndex)
  
  // Format with appropriate decimal places
  let formatted: string
  if (unitIndex === 0) {
    // Bytes - no decimal places
    formatted = size.toFixed(0)
  } else if (size < 10) {
    // Small numbers - 2 decimal places
    formatted = size.toFixed(2)
  } else if (size < 100) {
    // Medium numbers - 1 decimal place
    formatted = size.toFixed(1)
  } else {
    // Large numbers - no decimal places
    formatted = size.toFixed(0)
  }
  
  return `${formatted} ${units[unitIndex]}`
}

/**
 * Format file size with additional metadata
 */
export function formatFileSizeVerbose(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) {
    return 'Unknown size'
  }

  const formatted = formatFileSize(bytes)
  
  if (bytes < 1024) {
    return formatted
  }
  
  // Add the exact byte count in parentheses for larger files
  return `${formatted} (${bytes.toLocaleString()} bytes)`
}

/**
 * Get file size category for styling purposes
 */
export function getFileSizeCategory(bytes: number | undefined): 'small' | 'medium' | 'large' | 'unknown' {
  if (bytes === undefined || bytes === null) {
    return 'unknown'
  }
  
  const MB = 1024 * 1024
  
  if (bytes < MB) {
    return 'small'
  } else if (bytes < 10 * MB) {
    return 'medium'
  } else {
    return 'large'
  }
}

/**
 * Get appropriate color for file size
 */
export function getFileSizeColor(bytes: number | undefined): string {
  const category = getFileSizeCategory(bytes)
  
  switch (category) {
    case 'small':
      return 'text-green-600 dark:text-green-400'
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'large':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}