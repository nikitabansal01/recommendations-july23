/**
 * Utility functions for generating timestamps in both UTC and PT timezones
 */

export interface DualTimestamp {
  timestamp: string;        // UTC timestamp (ISO 8601)
  timestampPT: string;      // PT timestamp (YYYY-MM-DD HH:mm:ss)
  timezone: string;         // Timezone identifier
  createdAt: string;        // UTC creation timestamp
  createdAtPT: string;      // PT creation timestamp
}

/**
 * Generate dual timestamps (UTC and PT) for database storage
 * @param date Optional date object, defaults to current time
 * @returns Object containing both UTC and PT timestamps
 */
export function generateDualTimestamps(date?: Date): DualTimestamp {
  const now = date || new Date();
  
  return {
    timestamp: now.toISOString(), // UTC timestamp
    timestampPT: now.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' }), // PT timestamp
    timezone: 'America/Los_Angeles',
    createdAt: now.toISOString(),
    createdAtPT: now.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' })
  };
}

/**
 * Format a UTC timestamp for display in PT timezone
 * @param utcTimestamp ISO 8601 UTC timestamp
 * @returns Formatted PT timestamp string
 */
export function formatUTCToPT(utcTimestamp: string): string {
  const date = new Date(utcTimestamp);
  return date.toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
}

/**
 * Get current time in PT timezone
 * @returns Current time formatted for PT timezone
 */
export function getCurrentPTTime(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'America/Los_Angeles' });
}

/**
 * Get current time in UTC
 * @returns Current time in ISO 8601 format
 */
export function getCurrentUTCTime(): string {
  return new Date().toISOString();
}
