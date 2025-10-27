/**
 * CompactStatsCard - Streamlined stats for dashboard
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FocusWithParsedData, WinWithParsedData } from '../types';
import { calculateStats, formatDuration } from '../lib';

interface CompactStatsCardProps {
  focusHistory: FocusWithParsedData[];
  wins: WinWithParsedData[];
  isLoading?: boolean;
}

export function CompactStatsCard({
  focusHistory,
  wins,
  isLoading = false,
}: CompactStatsCardProps) {
  const stats = useMemo(
    () => calculateStats(focusHistory, wins),
    [focusHistory, wins]
  );

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const hasData = stats.weeklyTotal > 0 || stats.dailyTotal > 0;

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📊</span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Today's Focus
        </h3>
      </div>

      {!hasData ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No data yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's total */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent tabular-nums">
              {formatDuration(stats.dailyTotal)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Total focus time
            </div>
          </div>

          {/* Prime activity */}
          {stats.primeActivity && (
            <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">👑</span>
                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase">
                  Top Activity
                </span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                {stats.primeActivity.name}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formatDuration(stats.primeActivity.totalTime)} ({stats.primeActivity.percentage.toFixed(0)}%)
              </div>
            </div>
          )}

          {/* Top 3 activities */}
          {stats.topActivities.length > 0 && (
            <div className="space-y-2">
              {stats.topActivities.slice(0, 3).map((activity, index) => {
                const percentage = stats.dailyTotal > 0 ? (activity.time / stats.dailyTotal) * 100 : 0;
                return (
                  <div key={activity.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                        {index + 1}. {activity.name}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatDuration(activity.time)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
