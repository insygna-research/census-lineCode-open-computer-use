"""
Connection Manager - Advanced connection pooling and circuit breaker for VM WebSocket connections
Implements world-class reliability patterns for distributed systems
"""

import asyncio
import time
import logging
from typing import Dict, Optional, List, Tuple
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failures exceeded threshold, blocking calls
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class ConnectionMetrics:
    """Track connection health metrics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_latency: float = 0.0
    last_success: Optional[float] = None
    last_failure: Optional[float] = None
    consecutive_failures: int = 0
    consecutive_successes: int = 0
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_requests == 0:
            return 1.0
        return self.successful_requests / self.total_requests
    
    @property
    def average_latency(self) -> float:
        """Calculate average latency"""
        if self.successful_requests == 0:
            return 0.0
        return self.total_latency / self.successful_requests


@dataclass
class CircuitBreaker:
    """Circuit breaker for connection management"""
    failure_threshold: int = 5  # Failures before opening
    success_threshold: int = 3  # Successes in half-open before closing
    timeout: float = 30.0  # Seconds before trying half-open
    state: CircuitState = CircuitState.CLOSED
    metrics: ConnectionMetrics = field(default_factory=ConnectionMetrics)
    last_state_change: float = field(default_factory=time.time)
    
    def record_success(self, latency: float = 0.0):
        """Record a successful operation"""
        self.metrics.total_requests += 1
        self.metrics.successful_requests += 1
        self.metrics.consecutive_successes += 1
        self.metrics.consecutive_failures = 0
        self.metrics.last_success = time.time()
        self.metrics.total_latency += latency
        
        # State transitions
        if self.state == CircuitState.HALF_OPEN:
            if self.metrics.consecutive_successes >= self.success_threshold:
                self._transition_to(CircuitState.CLOSED)
                logger.info(f"Circuit breaker CLOSED after {self.metrics.consecutive_successes} successes")
    
    def record_failure(self):
        """Record a failed operation"""
        self.metrics.total_requests += 1
        self.metrics.failed_requests += 1
        self.metrics.consecutive_failures += 1
        self.metrics.consecutive_successes = 0
        self.metrics.last_failure = time.time()
        
        # State transitions
        if self.state == CircuitState.CLOSED:
            if self.metrics.consecutive_failures >= self.failure_threshold:
                self._transition_to(CircuitState.OPEN)
                logger.warning(f"Circuit breaker OPEN after {self.metrics.consecutive_failures} failures")
        elif self.state == CircuitState.HALF_OPEN:
            self._transition_to(CircuitState.OPEN)
            logger.warning("Circuit breaker OPEN again after failure in half-open state")
    
    def can_execute(self) -> bool:
        """Check if operation can be executed"""
        if self.state == CircuitState.CLOSED:
            return True
        elif self.state == CircuitState.OPEN:
            # Check if timeout has passed
            if time.time() - self.last_state_change >= self.timeout:
                self._transition_to(CircuitState.HALF_OPEN)
                logger.info("Circuit breaker entering HALF_OPEN state for testing")
                return True
            return False
        elif self.state == CircuitState.HALF_OPEN:
            return True
        return False
    
    def _transition_to(self, new_state: CircuitState):
        """Transition to a new state"""
        self.state = new_state
        self.last_state_change = time.time()
        if new_state == CircuitState.CLOSED:
            # Reset consecutive counters on close
            self.metrics.consecutive_failures = 0
            self.metrics.consecutive_successes = 0


class ConnectionPool:
    """
    Connection pool with health monitoring and automatic failover
    """
    
    def __init__(self, max_connections_per_host: int = 3):
        self.max_connections_per_host = max_connections_per_host
        self.connections: Dict[str, List[any]] = {}  # machine_id -> list of connections
        self.connection_metrics: Dict[str, ConnectionMetrics] = {}
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.connection_locks: Dict[str, asyncio.Lock] = {}
        self.health_check_interval = 10  # seconds
        self.health_check_tasks: Dict[str, asyncio.Task] = {}
        
    async def get_connection(self, machine_id: str):
        """Get a healthy connection from the pool"""
        # Check circuit breaker
        if machine_id not in self.circuit_breakers:
            self.circuit_breakers[machine_id] = CircuitBreaker()
        
        breaker = self.circuit_breakers[machine_id]
        if not breaker.can_execute():
            logger.warning(f"Circuit breaker OPEN for {machine_id}, rejecting request")
            return None
        
        # Get or create connection list
        if machine_id not in self.connections:
            self.connections[machine_id] = []
        
        # Find a healthy connection
        for conn in self.connections[machine_id]:
            if await self._is_connection_healthy(conn):
                return conn
        
        # No healthy connection found
        return None
    
    async def add_connection(self, machine_id: str, connection):
        """Add a connection to the pool"""
        if machine_id not in self.connections:
            self.connections[machine_id] = []
        
        # Enforce max connections limit
        if len(self.connections[machine_id]) >= self.max_connections_per_host:
            # Remove oldest connection
            old_conn = self.connections[machine_id].pop(0)
            await self._close_connection(old_conn)
        
        self.connections[machine_id].append(connection)
        
        # Start health check if not running
        if machine_id not in self.health_check_tasks:
            task = asyncio.create_task(self._health_check_loop(machine_id))
            self.health_check_tasks[machine_id] = task
    
    async def remove_connection(self, machine_id: str, connection):
        """Remove a connection from the pool"""
        if machine_id in self.connections:
            try:
                self.connections[machine_id].remove(connection)
                await self._close_connection(connection)
            except ValueError:
                pass  # Connection not in list
    
    async def _is_connection_healthy(self, connection) -> bool:
        """Check if a connection is healthy"""
        try:
            # Perform a quick ping test
            await asyncio.wait_for(connection.ping(), timeout=2.0)
            return not connection.closed
        except:
            return False
    
    async def _close_connection(self, connection):
        """Safely close a connection"""
        try:
            if not connection.closed:
                await connection.close()
        except:
            pass
    
    async def _health_check_loop(self, machine_id: str):
        """Periodic health check for connections"""
        while machine_id in self.connections:
            try:
                await asyncio.sleep(self.health_check_interval)
                
                # Check all connections for this machine
                if machine_id in self.connections:
                    unhealthy = []
                    for conn in self.connections[machine_id]:
                        if not await self._is_connection_healthy(conn):
                            unhealthy.append(conn)
                    
                    # Remove unhealthy connections
                    for conn in unhealthy:
                        logger.warning(f"Removing unhealthy connection for {machine_id}")
                        await self.remove_connection(machine_id, conn)
                        
            except Exception as e:
                logger.error(f"Error in health check loop for {machine_id}: {e}")
    
    def get_metrics(self, machine_id: str) -> Optional[ConnectionMetrics]:
        """Get metrics for a machine"""
        return self.connection_metrics.get(machine_id)
    
    def record_success(self, machine_id: str, latency: float = 0.0):
        """Record successful operation"""
        if machine_id in self.circuit_breakers:
            self.circuit_breakers[machine_id].record_success(latency)
    
    def record_failure(self, machine_id: str):
        """Record failed operation"""
        if machine_id in self.circuit_breakers:
            self.circuit_breakers[machine_id].record_failure()


class RetryStrategy:
    """
    Advanced retry strategy with exponential backoff and jitter
    """
    
    def __init__(
        self,
        max_retries: int = 10,
        initial_delay: float = 0.5,
        max_delay: float = 30.0,
        exponential_base: float = 2.0,
        jitter: bool = True
    ):
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
    
    def get_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number"""
        import random
        
        # Exponential backoff
        delay = min(
            self.initial_delay * (self.exponential_base ** attempt),
            self.max_delay
        )
        
        # Add jitter to prevent thundering herd
        if self.jitter:
            delay = delay * (0.5 + random.random())
        
        return delay
    
    async def execute_with_retry(self, func, *args, **kwargs):
        """Execute function with retry logic"""
        last_exception = None
        
        for attempt in range(self.max_retries):
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    delay = self.get_delay(attempt)
                    logger.info(f"Retry attempt {attempt + 1}/{self.max_retries} after {delay:.2f}s delay")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"All {self.max_retries} retry attempts failed")
        
        raise last_exception


# Global instances for connection management
connection_pool = ConnectionPool()
retry_strategy = RetryStrategy()