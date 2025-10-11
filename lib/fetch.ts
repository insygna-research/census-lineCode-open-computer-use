export async function fetchClient(input: RequestInfo, init?: RequestInit) {
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1]

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "x-csrf-token": csrf || "",
      "Content-Type": "application/json",
    },
  })
}

interface RetryOptions {
  maxRetries?: number
  timeoutMs?: number
  retryDelay?: number
  exponentialBackoff?: boolean
}

// Simple circuit breaker for external API calls
class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN'
    }
  }

  getState() {
    return this.state
  }
}

// Global circuit breaker for user metadata fetching
const userMetadataCircuitBreaker = new CircuitBreaker(3, 60000) // 3 failures, 1 minute recovery

export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    timeoutMs = 5000,
    retryDelay = 1000,
    exponentialBackoff = true
  } = options

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
      
      const result = await Promise.race([fetchFn(), timeoutPromise])
      return result
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with optional exponential backoff
      const delay = exponentialBackoff 
        ? Math.min(retryDelay * Math.pow(2, attempt - 1), 10000)
        : retryDelay
      
      console.log(`Retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('All retry attempts failed')
}

export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  fallback: T,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await fetchWithRetry(operation, options)
  } catch (error) {
    console.error('Operation failed, using fallback:', error)
    return fallback
  }
}

export async function safeUserMetadataFetch<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await userMetadataCircuitBreaker.execute(operation)
  } catch (error) {
    console.error('User metadata fetch failed (circuit breaker may be open):', error)
    return fallback
  }
}
