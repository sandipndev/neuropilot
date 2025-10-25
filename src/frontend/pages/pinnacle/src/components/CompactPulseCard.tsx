/**
 * CompactPulseCard - Streamlined pulse insights for dashboard
 */

import { motion } from 'framer-motion';
import { Lightbulb, Clock, TrendingUp, Activity } from 'lucide-react';
import type { Pulse } from '../../../../../db/models/pulse';
import { formatRelativeTime } from '../lib/time';

interface CompactPulseCardProps {
  pulses: Pulse[];
  isLoading?: boolean;
}

type PulseCategory = 'insight' | 'reminder' | 'recap' | 'trend';

function categorizePulse(message: string): PulseCategory {
  const lower = message.toLowerCase();
  if (lower.includes('insight') || lower.includes('notice')) return 'insight';
  if (lower.includes('remember') || lower.includes('reminder')) return 'reminder';
  if (lower.includes('trend') || lower.includes('pattern')) return 'trend';
  return 'recap';
}

function getCategoryIcon(category: PulseCategory) {
  switch (category) {
    case 'insight': return <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
    case 'reminder': return <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'trend': return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'recap': return <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
  }
}

export function CompactPulseCard({ pulses, isLoading = false }: CompactPulseCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.span
          className="text-xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          💓
        </motion.span>
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Activity Pulse
        </h3>
      </div>

      {pulses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No insights yet
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {pulses.slice(0, 5).map((pulse, index) => {
            const category = categorizePulse(pulse.message);
            return (
              <motion.div
                key={pulse.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <div className="shrink-0 mt-0.5">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 dark:text-gray-100 leading-relaxed">
                      {pulse.message}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      {formatRelativeTime(pulse.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
