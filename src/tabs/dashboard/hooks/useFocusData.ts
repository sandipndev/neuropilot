/**
 * useFocusData Hook
 * Fetches current focus and focus history with live updates
 */

import { useLiveQuery } from 'dexie-react-hooks';
import db from '~/db';
import type { Focus } from '~/db';

export interface FocusWithParsedData extends Focus {
  focus_item: string;
  total_time_spent: number;
}

interface UseFocusDataReturn {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  isLoading: boolean;
  error: Error | null;
}

export function useFocusData(): UseFocusDataReturn {
  const data = useLiveQuery(
    async () => {
      try {
        // Get all focus items from database
        const allFocus = await db.focus.toArray();

        // Transform to match expected format
        const transformed = allFocus.map((f): FocusWithParsedData => {
          const totalTime = f.time_spent.reduce((acc, ts) => {
            const end = ts.end || Date.now();
            return acc + (end - ts.start);
          }, 0);

          return {
            ...f,
            focus_item: f.item,
            total_time_spent: totalTime
          };
        });

        // Sort by last_updated descending
        const sorted = transformed.sort((a, b) => b.last_updated - a.last_updated);

        // Current focus is the most recently updated with an open time_spent
        const current = sorted.find(f =>
          f.time_spent.some(ts => ts.end === null)
        ) || null;

        return { currentFocus: current, focusHistory: sorted };
      } catch (err) {
        console.error('Error fetching focus data:', err);
        throw err;
      }
    },
    []
  );

  return {
    currentFocus: data?.currentFocus ?? null,
    focusHistory: data?.focusHistory ?? [],
    isLoading: data === undefined,
    error: null
  };
}
