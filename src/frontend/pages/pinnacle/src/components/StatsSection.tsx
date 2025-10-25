/**
 * StatsSection Component
 * Displays weekly and daily focus statistics with visual representations
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FocusWithParsedData, WinWithParsedData } from '../types';
import { calculateStats, formatDuration } from '../lib';

interface StatsSectionProps {
  focusHistory: FocusWithParsedData[];
  wins: WinWithParsedData[];
  isLoading?: boolean;
}

type ViewMode = 'week' | 'day';

export function StatsSection({
  focusHistory,
  wins,
  isLoading = false,
}: StatsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Calculate statistics
  const stats = useMemo(
    () => calculateStats(focusHistory, wins),
    [focusHistory, wins]
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Check if there's any data
  const hasData = stats.weeklyTotal > 0 || stats.dailyTotal > 0;

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6"
      >
        <EmptyState />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6"
    >
      {/* Header with toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Focus Statistics
        </h2>
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </div>

      {/* Prime Activity Section */}
      {stats.primeActivity && (
        <PrimeActivityCard primeActivity={stats.primeActivity} />
      )}

      {/* Total Time Display */}
      <TotalTimeDisplay
        viewMode={viewMode}
        dailyTotal={stats.dailyTotal}
        weeklyTotal={stats.weeklyTotal}
      />

      {/* Top Activities */}
      {stats.topActivities.length > 0 && (
        <TopActivitiesList
          activities={stats.topActivities}
          totalTime={viewMode === 'week' ? stats.weeklyTotal : stats.dailyTotal}
        />
      )}
    </motion.div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No Statistics Yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Start focusing to see your productivity statistics here
      </p>
    </div>
  );
}

// View Toggle Component
interface ViewToggleProps {
  viewMode: ViewMode;
  onToggle: (mode: ViewMode) => void;
}

function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
      <button
        onClick={() => onToggle('day')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'day'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        Day
      </button>
      <button
        onClick={() => onToggle('week')}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'week'
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
        }`}
      >
        Week
      </button>
    </div>
  );
}

// Prime Activity Card Component
interface PrimeActivityCardProps {
  primeActivity: {
    name: string;
    totalTime: number;
    percentage: number;
  };
}

function PrimeActivityCard({ primeActivity }: PrimeActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-3xl">👑</div>
        <div>
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
            Prime Activity
          </h3>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {primeActivity.name}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mt-3">
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatDuration(primeActivity.totalTime)}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          ({primeActivity.percentage.toFixed(1)}% of total time)
        </span>
      </div>
    </motion.div>
  );
}

// Total Time Display Component
interface TotalTimeDisplayProps {
  viewMode: ViewMode;
  dailyTotal: number;
  weeklyTotal: number;
}

function TotalTimeDisplay({
  viewMode,
  dailyTotal,
  weeklyTotal,
}: TotalTimeDisplayProps) {
  const displayTotal = viewMode === 'week' ? weeklyTotal : dailyTotal;
  const label = viewMode === 'week' ? 'This Week' : 'Today';

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Total Focus Time - {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {formatDuration(displayTotal)}
          </p>
        </div>
        <div className="text-4xl">⏱️</div>
      </div>
    </div>
  );
}

// Top Activities List Component
interface TopActivitiesListProps {
  activities: Array<{ name: string; time: number }>;
  totalTime: number;
}

function TopActivitiesList({ activities, totalTime }: TopActivitiesListProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Top Activities
      </h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ActivityBar
            key={activity.name}
            activity={activity}
            totalTime={totalTime}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

// Activity Bar Component
interface ActivityBarProps {
  activity: { name: string; time: number };
  totalTime: number;
  rank: number;
}

function ActivityBar({ activity, totalTime, rank }: ActivityBarProps) {
  const percentage = totalTime > 0 ? (activity.time / totalTime) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className="relative"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-4">
            {rank}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
            {activity.name}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {formatDuration(activity.time)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: rank * 0.05 }}
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full"
        />
      </div>
    </motion.div>
  );
}
