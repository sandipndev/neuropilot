/**
 * Focus-related type definitions
 * Based on the Focus API and data models from readme.md
 */

/**
 * Represents the current focus session data
 */
export interface FocusData {
  id: string;
  focusItem: string;
  keywords: string[];
  timeSpent: Array<{
    start: number; // Timestamp
    stop: number; // Timestamp
  }>;
  totalFocusTime: number; // Total accumulated time in milliseconds
  isActive: boolean;
  lastUpdated: number; // Timestamp
}

/**
 * Represents a historical focus item
 */
export interface FocusHistoryItem {
  id: string;
  focusItem: string;
  timestamp: number;
  duration: number; // milliseconds
  keywords: string[];
}

/**
 * Represents past week's focus summary
 */
export interface PastWeeksFocus {
  id: string;
  focusItem: string;
  totalTimeSpent: number; // milliseconds
}

/**
 * Prime activity state types
 */
export type PrimeActivityState = 'START_FOCUS' | 'IN_SESSION' | 'WIND_DOWN';

/**
 * Prime activity query response
 */
export interface PrimeActivity {
  state: PrimeActivityState;
  context: {
    focus: FocusData[];
    totalFocusToday: number; // milliseconds
  };
}
