/**
 * useFocusData Hook
 * Fetches current focus and focus history with polling
 */

import { useState, useEffect } from 'react';
import { getFocusData, getCurrentFocus, type FocusWithParsedData } from '../../../../../api/queries/focus';

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
        const [current, history] = await Promise.all([
          getCurrentFocus(),
          getFocusData()
        ]);

        if (isMounted) {
          setCurrentFocus(current);
          setFocusHistory(history);
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
