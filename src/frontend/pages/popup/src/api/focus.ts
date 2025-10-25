import {
  getCurrentFocus,
  getFocusData,
  type FocusWithParsedData,
} from "neuropilot-api";

/**
 * Fetch current focus data from the background service
 */
export async function getCurrentFocusData(): Promise<FocusWithParsedData | null> {
  return getCurrentFocus();
}

/**
 * Fetch last 5 focus items from the background service
 */
export async function getFocusHistory(): Promise<FocusWithParsedData[]> {
  const allFocus = await getFocusData();

  // Return last 5 items, sorted by last_updated descending
  return allFocus
    .sort((a, b) => b.last_updated - a.last_updated)
    .slice(0, 5);
}
