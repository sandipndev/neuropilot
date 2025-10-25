/**
 * useActivitySummary Hook
 * Fetches the latest activity summary
 */

import { useState, useEffect } from 'react';
import { getLatestActivitySummary } from '../../../../../api/queries/activity-summary';
import type { ActivitySummary } from '../../../../../db/models/activity-summary';

interface UseActivitySummaryReturn {
  activitySummary: ActivitySummary | null;
  isLoading: boolean;
  error: Error | null;
}

export function useActivitySummary(): UseActivitySummaryReturn {
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchActivitySummary() {
      try {
        setIsLoading(true);
        const data = await getLatestActivitySummary();

        if (isMounted) {
          setActivitySummary(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch activity summary'));
          console.error('Error fetching activity summary:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchActivitySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return { activitySummary, isLoading, error };
}
