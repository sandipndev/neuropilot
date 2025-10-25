/**
 * useWinsData Hook
 * Fetches top wins data
 */

import { useState, useEffect } from 'react';
import { getTopWins, type WinWithParsedData } from '../../../../../api/queries/wins';

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
        const data = await getTopWins(limit);

        if (isMounted) {
          setWins(data);
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
