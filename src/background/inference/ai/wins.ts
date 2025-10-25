/**
 * Wins Generation AI
 * Extracts top 3 focus items by time spent and records them as past wins
 * Always maintains exactly 3 wins in the database
 */

import { getFocusData } from "../../../api/queries/focus";
import { hashString } from "../../../db/utils/hash";
import { savePastWin, clearAllPastWins, PastWin } from "../../../db/models/past-wins";

export interface WinsGenerationResult {
  wins: PastWin[];
  updated: boolean;
}

/**
 * Generate and save wins from top focus items
 * Clears all existing wins and saves only the top 3
 */
export async function generateWins(): Promise<WinsGenerationResult> {
  // Get all focus data
  const focusRecords = await getFocusData();

  // If no focus data, clear wins and return empty
  if (focusRecords.length === 0) {
    console.debug("No focus data available for wins generation");
    await clearAllPastWins();
    return {
      wins: [],
      updated: false,
    };
  }

  // Sort by total_time descending and take top 3
  const topFocusItems = focusRecords.sort((a, b) => b.total_time - a.total_time).slice(0, 3);

  console.debug(`Top 3 focus items by time:`, topFocusItems);

  // Clear all existing wins first
  await clearAllPastWins();

  // Record the top 3 as wins
  const now = Date.now();
  const wins: PastWin[] = [];

  for (const focusItem of topFocusItems) {
    // Only record if it has meaningful time (at least 5 minutes)
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    if (focusItem.total_time < FIVE_MINUTES_MS) {
      console.debug(
        `Skipping ${focusItem.focus_item} - insufficient time (${focusItem.total_time}ms)`
      );
      continue;
    }

    // Create unique ID for this win
    const winId = await hashString(`${focusItem.focus_item.toLowerCase()}-${now}`);

    const pastWin: PastWin = {
      id: winId,
      focus_item: focusItem.focus_item,
      time_spent: focusItem.total_time,
      recorded_at: now,
      keywords: JSON.stringify(focusItem.keywords),
    };

    await savePastWin(pastWin);
    wins.push(pastWin);
    console.debug(`Recorded win: ${focusItem.focus_item} (${focusItem.total_time}ms)`);
  }

  return {
    wins,
    updated: true,
  };
}
