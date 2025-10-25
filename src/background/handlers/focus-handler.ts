/**
 * Focus Query Handler
 * Handles focus data requests from popup and other UI components
 */

import { getCurrentFocus, getFocusData } from "../../api/queries/focus";

export async function handleGetCurrentFocus() {
  const currentFocus = await getCurrentFocus();
  return { success: true, data: currentFocus };
}

export async function handleGetFocusHistory() {
  const focusHistory = await getFocusData();
  // Return last 5 items, sorted by last_updated descending
  const sortedHistory = focusHistory
    .sort((a, b) => b.last_updated - a.last_updated)
    .slice(0, 5);
  return { success: true, data: sortedHistory };
}
