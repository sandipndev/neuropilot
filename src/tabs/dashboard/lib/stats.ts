// Statistics calculation utilities

import type { FocusWithParsedData, WinWithParsedData, StatsData } from '../types';

/**
 * Calculate comprehensive statistics from focus history and wins
 * @param focusHistory - Array of focus sessions
 * @param wins - Array of wins
 * @returns Calculated statistics data
 */
export function calculateStats(
  focusHistory: FocusWithParsedData[],
  wins: WinWithParsedData[]
): StatsData {
  // Calculate daily total (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const dailyFocus = focusHistory.filter((f) => f.last_updated >= oneDayAgo);
  const dailyTotal = dailyFocus.reduce((sum, f) => sum + f.total_time_spent, 0);

  // Calculate weekly total (last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyFocus = focusHistory.filter((f) => f.last_updated >= oneWeekAgo);
  const weeklyTotal = weeklyFocus.reduce((sum, f) => sum + f.total_time_spent, 0);

  // Calculate wins
  const dailyWins = wins.filter((w) => w.recorded_at >= oneDayAgo);
  const weeklyWins = wins.filter((w) => w.recorded_at >= oneWeekAgo);

  // Aggregate by focus item
  const activityMap = new Map<string, number>();
  weeklyFocus.forEach((focus) => {
    const current = activityMap.get(focus.focus_item) || 0;
    activityMap.set(focus.focus_item, current + focus.total_time_spent);
  });

  // Find top activities
  const topActivities = Array.from(activityMap.entries())
    .map(([name, time]) => ({ name, time }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  // Determine prime activity
  const primeActivity = topActivities[0]
    ? {
        name: topActivities[0].name,
        totalTime: topActivities[0].time,
        percentage: weeklyTotal > 0 ? (topActivities[0].time / weeklyTotal) * 100 : 0,
      }
    : null;

  return {
    primeActivity,
    dailyTotal,
    weeklyTotal,
    topActivities,
    dailyWins: dailyWins.length,
    weeklyWins: weeklyWins.length,
  };
}

/**
 * Calculate total focus time for a given time period
 * @param focusHistory - Array of focus sessions
 * @param startTime - Start of time period (timestamp in ms)
 * @returns Total time in milliseconds
 */
export function calculateTotalFocusTime(
  focusHistory: FocusWithParsedData[],
  startTime: number
): number {
  return focusHistory
    .filter((f) => f.last_updated >= startTime)
    .reduce((sum, f) => sum + f.total_time_spent, 0);
}

/**
 * Calculate daily total focus time (last 24 hours)
 * @param focusHistory - Array of focus sessions
 * @returns Total time in milliseconds
 */
export function calculateDailyTotal(focusHistory: FocusWithParsedData[]): number {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return calculateTotalFocusTime(focusHistory, oneDayAgo);
}

/**
 * Calculate weekly total focus time (last 7 days)
 * @param focusHistory - Array of focus sessions
 * @returns Total time in milliseconds
 */
export function calculateWeeklyTotal(focusHistory: FocusWithParsedData[]): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return calculateTotalFocusTime(focusHistory, oneWeekAgo);
}

/**
 * Get activities aggregated by focus item with total time
 * @param focusHistory - Array of focus sessions
 * @param startTime - Start of time period (timestamp in ms)
 * @returns Map of activity name to total time
 */
export function aggregateActivitiesByTime(
  focusHistory: FocusWithParsedData[],
  startTime: number
): Map<string, number> {
  const activityMap = new Map<string, number>();
  
  focusHistory
    .filter((f) => f.last_updated >= startTime)
    .forEach((focus) => {
      const current = activityMap.get(focus.focus_item) || 0;
      activityMap.set(focus.focus_item, current + focus.total_time_spent);
    });

  return activityMap;
}

/**
 * Get top N activities by time spent
 * @param focusHistory - Array of focus sessions
 * @param startTime - Start of time period (timestamp in ms)
 * @param limit - Number of top activities to return
 * @returns Array of activities sorted by time (descending)
 */
export function getTopActivities(
  focusHistory: FocusWithParsedData[],
  startTime: number,
  limit: number = 5
): Array<{ name: string; time: number }> {
  const activityMap = aggregateActivitiesByTime(focusHistory, startTime);
  
  return Array.from(activityMap.entries())
    .map(([name, time]) => ({ name, time }))
    .sort((a, b) => b.time - a.time)
    .slice(0, limit);
}

/**
 * Determine the prime activity (most time spent)
 * @param focusHistory - Array of focus sessions
 * @param startTime - Start of time period (timestamp in ms)
 * @returns Prime activity with details or null if no data
 */
export function getPrimeActivity(
  focusHistory: FocusWithParsedData[],
  startTime: number
): { name: string; totalTime: number; percentage: number } | null {
  const topActivities = getTopActivities(focusHistory, startTime, 1);
  
  if (topActivities.length === 0) {
    return null;
  }

  const totalTime = calculateTotalFocusTime(focusHistory, startTime);
  const primeActivity = topActivities[0];

  return {
    name: primeActivity.name,
    totalTime: primeActivity.time,
    percentage: totalTime > 0 ? (primeActivity.time / totalTime) * 100 : 0,
  };
}

/**
 * Calculate daily wins count (last 24 hours)
 * @param wins - Array of wins
 * @returns Number of wins in the last 24 hours
 */
export function calculateDailyWins(wins: WinWithParsedData[]): number {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return wins.filter((w) => w.recorded_at >= oneDayAgo).length;
}

/**
 * Calculate weekly wins count (last 7 days)
 * @param wins - Array of wins
 * @returns Number of wins in the last 7 days
 */
export function calculateWeeklyWins(wins: WinWithParsedData[]): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return wins.filter((w) => w.recorded_at >= oneWeekAgo).length;
}

/**
 * Get wins for a specific time period
 * @param wins - Array of wins
 * @param startTime - Start of time period (timestamp in ms)
 * @returns Filtered wins array
 */
export function getWinsByTime(
  wins: WinWithParsedData[],
  startTime: number
): WinWithParsedData[] {
  return wins.filter((w) => w.recorded_at >= startTime);
}
