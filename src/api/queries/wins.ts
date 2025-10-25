/**
 * API Query: Get wins data
 */

import { getAllPastWins, parseKeywords } from "../../db/models/past-wins";

export interface WinWithParsedData {
  id: string;
  focus_item: string;
  time_spent: number; // in milliseconds
  recorded_at: number;
  keywords: string[];
  time_spent_hours: number; // Formatted for display
}

/**
 * Get all past wins with parsed data
 * Returns array sorted by recorded_at (most recent first)
 */
export async function getWins(): Promise<WinWithParsedData[]> {
  const pastWins = await getAllPastWins();

  return pastWins.map((win) => ({
    id: win.id,
    focus_item: win.focus_item,
    time_spent: win.time_spent,
    recorded_at: win.recorded_at,
    keywords: parseKeywords(win),
    time_spent_hours: parseFloat((win.time_spent / (1000 * 60 * 60)).toFixed(2)),
  }));
}

/**
 * Get wins from a specific time period
 */
export async function getWinsSince(sinceTimestamp: number): Promise<WinWithParsedData[]> {
  const allWins = await getWins();
  return allWins.filter((win) => win.recorded_at >= sinceTimestamp);
}

/**
 * Get wins by focus item
 */
export async function getWinsByFocusItem(focusItem: string): Promise<WinWithParsedData[]> {
  const allWins = await getWins();
  return allWins.filter((win) => win.focus_item.toLowerCase().includes(focusItem.toLowerCase()));
}

/**
 * Get top wins by time spent
 */
export async function getTopWins(limit: number = 10): Promise<WinWithParsedData[]> {
  const allWins = await getWins();

  // Sort by time_spent descending and take top N
  return allWins.sort((a, b) => b.time_spent - a.time_spent).slice(0, limit);
}
