/**
 * useWinsData Hook
 * Fetches top wins data
 */

import { useState, useEffect } from 'react';
import db, { type PastWin } from '~/db';

export interface WinWithParsedData extends PastWin {
  focus_item: string;
  time_spent: number;
  time_spent_hours: number;
  recorded_at: number;
}

interface UseWinsDataReturn {
  wins: WinWithParsedData[];
  isLoading: boolean;
  error: Error | null;
}

export function useWinsData(limit: number = 10): UseWinsDataReturn {
  const [wins, setWins] = useState<WinWithParsedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchWins() {
      try {
        setIsLoading(true);
        
        // Get wins from database, sorted by time spent descending
        const data = await db.pastWins
          .orderBy('time_spent')
          .reverse()
          .limit(limit)
          .toArray();

        if (isMounted) {
          setWins(data as WinWithParsedData[]);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch wins data'));
          console.error('Error fetching wins:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchWins();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  return { wins, isLoading, error };
}
