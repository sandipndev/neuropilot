/**
 * useFocusData Hook
 * Fetches current focus and focus history with polling
 */

import { useState, useEffect } from 'react';
import db, { type Focus } from '~/db';

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

const POLL_INTERVAL = 5000; // 5 seconds

export function useFocusData(): UseFocusDataReturn {
  const [currentFocus, setCurrentFocus] = useState<FocusWithParsedData | null>(null);
  const [focusHistory, setFocusHistory] = useState<FocusWithParsedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
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

        if (isMounted) {
          // Current focus is the most recently updated with an open time_spent
          const current = sorted.find(f => 
            f.time_spent.some(ts => ts.end === null)
          ) || null;
          
          setCurrentFocus(current);
          setFocusHistory(sorted);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch focus data'));
          console.error('Error fetching focus data:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Initial fetch
    fetchData();

    // Set up polling
    const interval = setInterval(fetchData, POLL_INTERVAL);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { currentFocus, focusHistory, isLoading, error };
}
