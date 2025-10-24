/**
 * API Query: Get focus data
 */

import {
  getAllFocus,
  getActiveFocus,
  parseKeywords,
  parseTimeSpent,
  type Focus,
} from "../../db/models/focus";

export interface FocusWithParsedData {
  id: string;
  focus_item: string;
  keywords: string[];
  time_spent: Array<{
    start: number;
    stop: number | null;
  }>;
  last_updated: number;
  total_time: number; // Total time in milliseconds
}

/**
 * Get all focus records with parsed data
 */
export async function getFocusData(): Promise<FocusWithParsedData[]> {
  const focusRecords = await getAllFocus();

  return focusRecords.map((focus) => {
    const timeSpent = parseTimeSpent(focus);
    const totalTime = calculateTotalTime(timeSpent);

    return {
      id: focus.id,
      focus_item: focus.focus_item,
      keywords: parseKeywords(focus),
      time_spent: timeSpent,
      last_updated: focus.last_updated,
      total_time: totalTime,
    };
  });
}

/**
 * Get the current active focus with parsed data
 */
export async function getCurrentFocus(): Promise<FocusWithParsedData | null> {
  const focus = await getActiveFocus();

  if (!focus) {
    return null;
  }

  const timeSpent = parseTimeSpent(focus);
  const totalTime = calculateTotalTime(timeSpent);

  return {
    id: focus.id,
    focus_item: focus.focus_item,
    keywords: parseKeywords(focus),
    time_spent: timeSpent,
    last_updated: focus.last_updated,
    total_time: totalTime,
  };
}

/**
 * Calculate total time spent from time_spent array
 */
function calculateTotalTime(timeSpent: Array<{ start: number; stop: number | null }>): number {
  return timeSpent.reduce((total, period) => {
    const end = period.stop || Date.now();
    return total + (end - period.start);
  }, 0);
}
