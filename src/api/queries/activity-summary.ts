/**
 * Activity Summary Query API
 * Read operations for activity summaries
 */

import {
  getAllActivitySummaries,
  getRecentActivitySummaries,
  ActivitySummary,
} from "../../db/models/activity-summary";

/**
 * Get all activity summaries
 */
export async function getActivitySummaries(): Promise<ActivitySummary[]> {
  return getAllActivitySummaries();
}

/**
 * Get recent activity summaries within the last N minutes
 */
export async function getRecentActivitySummariesByMinutes(
  minutes: number
): Promise<ActivitySummary[]> {
  const now = Date.now();
  const sinceTimestamp = now - minutes * 60 * 1000;
  return getRecentActivitySummaries(sinceTimestamp);
}

/**
 * Get the most recent activity summary
 */
export async function getLatestActivitySummary(): Promise<ActivitySummary | null> {
  const summaries = await getAllActivitySummaries();
  return summaries.length > 0 ? summaries[0] : null;
}
