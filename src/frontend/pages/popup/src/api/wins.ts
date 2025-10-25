import type { WinItem } from '../types/wins';
import { getTopWins } from 'neuropilot-api';

/**
 * Fetch recent wins
 */
export async function getWinsData(): Promise<WinItem[]> {
  const wins = await getTopWins(3);
  
  return wins.map((win) => ({
    id: win.id,
    focusItem: win.focus_item,
    totalTimeSpent: win.time_spent,
    text: `Completed ${win.time_spent_hours} hours of focused work`,
    timestamp: win.recorded_at,
    type: 'milestone' as const,
  }));
}
