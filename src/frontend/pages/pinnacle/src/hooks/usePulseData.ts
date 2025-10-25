/**
 * usePulseData Hook
 * Fetches pulse data with polling
 */

import { useState, useEffect } from 'react';
import { getPulses } from '../../../../../api/queries/pulse';
import type { Pulse } from '../../../../../db/models/pulse';

interface UsePulseDataReturn {
  pulses: Pulse[];
  isLoading: boolean;
  error: Error | null;
}

const POLL_INTERVAL = 60000; // 60 seconds

export function usePulseData(): UsePulseDataReturn {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPulses() {
      try {
        const data = await getPulses();

        if (isMounted) {
          setPulses(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch pulse data'));
          console.error('Error fetching pulses:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Initial fetch
    fetchPulses();

    // Set up polling
    const interval = setInterval(fetchPulses, POLL_INTERVAL);

    // Cleanup
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { pulses, isLoading, error };
}
