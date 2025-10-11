/**
 * Utility functions for handling dates and temporal information in system prompts
 */

export interface TemporalInfo {
  currentDate: string;
  currentDateFormatted: string;
  currentYear: number;
  currentMonth: string;
  currentMonthNumber: number;
  currentDay: number;
  currentDayOfWeek: string;
  currentTime: string;
  timezone: string;
  iso: string;
}

/**
 * Get current temporal information for use in system prompts
 */
export function getCurrentTemporalInfo(): TemporalInfo {
  const now = new Date();
  
  // Format dates in different styles
  const currentDateFormatted = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const currentDate = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  });
  
  const currentTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long' });
  const currentDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  return {
    currentDate,
    currentDateFormatted,
    currentYear: now.getFullYear(),
    currentMonth,
    currentMonthNumber: now.getMonth() + 1,
    currentDay: now.getDate(),
    currentDayOfWeek,
    currentTime,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    iso: now.toISOString(),
  };
}

/**
 * Create a temporal context string for system prompts
 */
export function createTemporalContext(): string {
  const temporal = getCurrentTemporalInfo();
  
  return `Today is ${temporal.currentDayOfWeek}, ${temporal.currentDateFormatted} (${temporal.currentDate}). The current year is ${temporal.currentYear}.`;
}

/**
 * Create a detailed temporal context for search and analysis
 */
export function createDetailedTemporalContext(): string {
  const temporal = getCurrentTemporalInfo();
  
  return `CURRENT TEMPORAL CONTEXT:
- Today's Date: ${temporal.currentDayOfWeek}, ${temporal.currentDateFormatted}
- Current Year: ${temporal.currentYear}
- Current Month: ${temporal.currentMonth} ${temporal.currentYear}
- Time Zone: ${temporal.timezone}
- When discussing "recent," "current," or "latest" information, reference ${temporal.currentYear} as the current year.
- For search queries involving time-sensitive topics, include temporal indicators like "${temporal.currentYear}", "latest", "recent", or "${temporal.currentMonth} ${temporal.currentYear}".`;
}

/**
 * Format date for search result contexts
 */
export function formatDateForSearchResults(): string {
  const temporal = getCurrentTemporalInfo();
  return `${temporal.currentMonth} ${temporal.currentYear}`;
}

/**
 * Get a date string for mock result generation
 */
export function getDateStringForMockResults(): string {
  const temporal = getCurrentTemporalInfo();
  return temporal.currentDateFormatted;
}
