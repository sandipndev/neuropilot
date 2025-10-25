/**
 * FocusStateSection Component
 * Displays the current focus state with contextual messaging
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusWithParsedData } from '../types';
import {
  determineFocusState,
  getCurrentFocusElapsedTime,
  calculateDailyFocusTime,
  formatDuration,
} from '../lib';

interface FocusStateSectionProps {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  isLoading?: boolean;
}

export function FocusStateSection({
  currentFocus,
  focusHistory,
  isLoading = false,
}: FocusStateSectionProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Determine the current focus state
  const focusState = determineFocusState(currentFocus, focusHistory);
  const totalDailyFocusTime = calculateDailyFocusTime(focusHistory);

  // Update elapsed time every second for active focus
  useEffect(() => {
    if (focusState === 'active-focus' && currentFocus) {
      // Initial calculation
      setElapsedTime(getCurrentFocusElapsedTime(currentFocus));

      // Update every second
      const interval = setInterval(() => {
        setElapsedTime(getCurrentFocusElapsedTime(currentFocus));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [focusState, currentFocus]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6"
    >
      <AnimatePresence mode="wait">
        {focusState === 'no-focus' && (
          <NoFocusState key="no-focus" />
        )}
        {focusState === 'active-focus' && (
          <ActiveFocusState
            key="active-focus"
            currentFocus={currentFocus}
            focusHistory={focusHistory}
            elapsedTime={elapsedTime}
          />
        )}
        {focusState === 'wind-down' && (
          <WindDownState
            key="wind-down"
            totalDailyFocusTime={totalDailyFocusTime}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// No Focus State Component
function NoFocusState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <div className="text-6xl mb-4">🎯</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Ready to Focus?
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-lg">
        Start your first focus session and build momentum!
      </p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">
        Open the extension popup to begin tracking your focus time
      </p>
    </motion.div>
  );
}

// Active Focus State Component
interface ActiveFocusStateProps {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  elapsedTime: number;
}

function ActiveFocusState({
  currentFocus,
  focusHistory,
  elapsedTime,
}: ActiveFocusStateProps) {
  // If there's a current focus, show it
  if (currentFocus) {
    const isActive = currentFocus.time_spent.some((entry) => entry.stop === null);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="py-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔥</div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {isActive ? 'Currently Focusing On' : 'Last Focus Session'}
              </h3>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {currentFocus.focus_item}
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-green-500 rounded-full"
            />
          )}
          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatDuration(elapsedTime)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
            {isActive ? 'elapsed' : 'total'}
          </span>
        </div>

        {currentFocus.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentFocus.keywords.slice(0, 5).map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // If no current focus but has history, show most recent
  if (focusHistory.length > 0) {
    const mostRecent = focusHistory[0];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="py-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">✅</div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Most Recent Session
            </h3>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {mostRecent.focus_item}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {formatDuration(mostRecent.total_time)}
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
            completed
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
          Great work! Ready to start another focus session?
        </p>
      </motion.div>
    );
  }

  // Fallback (shouldn't reach here based on determineFocusState logic)
  return <NoFocusState />;
}

// Wind Down State Component
interface WindDownStateProps {
  totalDailyFocusTime: number;
}

function WindDownState({ totalDailyFocusTime }: WindDownStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <div className="text-6xl mb-4">🌙</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Time to Wind Down
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
        You've had an incredibly productive day!
      </p>
      <div className="inline-block px-6 py-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
        <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
          {formatDuration(totalDailyFocusTime)}
        </span>
        <span className="text-gray-600 dark:text-gray-400 text-sm ml-2">
          of focused work today
        </span>
      </div>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-6">
        Consider taking a break, getting some rest, and recharging for tomorrow
      </p>
    </motion.div>
  );
}
