/**
 * CompactFocusCard - Streamlined focus display for dashboard
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { FocusWithParsedData } from '../types';
import {
  determineFocusState,
  getCurrentFocusElapsedTime,
  formatDuration,
} from '../lib';

interface CompactFocusCardProps {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  isLoading?: boolean;
}

export function CompactFocusCard({
  currentFocus,
  focusHistory,
  isLoading = false,
}: CompactFocusCardProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const focusState = determineFocusState(currentFocus, focusHistory);

  useEffect(() => {
    if (focusState === 'active-focus' && currentFocus) {
      setElapsedTime(getCurrentFocusElapsedTime(currentFocus));
      const interval = setInterval(() => {
        setElapsedTime(getCurrentFocusElapsedTime(currentFocus));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [focusState, currentFocus]);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const isActive = currentFocus?.time_spent.some((entry) => entry.end === null);

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-lg hover:shadow-xl transition-all"
    >
      {focusState === 'no-focus' ? (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
            Ready to Focus?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start a session to begin
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <motion.div
              className="text-3xl"
              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {isActive ? '🔥' : '✅'}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {isActive ? 'Focusing On' : 'Last Session'}
              </p>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                {currentFocus?.focus_item || focusHistory[0]?.focus_item}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl">
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-500 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent tabular-nums">
                {formatDuration(elapsedTime)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {isActive ? 'in progress' : 'completed'}
              </div>
            </div>
          </div>

          {currentFocus?.keywords && currentFocus.keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {currentFocus.keywords.slice(0, 3).map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
