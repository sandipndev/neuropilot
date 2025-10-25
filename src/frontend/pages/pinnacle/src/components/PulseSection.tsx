/**
 * PulseSection Component
 * Displays pulse data showing activity patterns and insights
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Lightbulb, Clock, TrendingUp } from 'lucide-react';
import type { Pulse } from '../../../../../db/models/pulse';
import { formatRelativeTime } from '../lib/time';

interface PulseSectionProps {
  pulses: Pulse[];
  isLoading?: boolean;
}

type PulseCategory = 'insight' | 'reminder' | 'recap' | 'trend';

/**
 * Categorize pulse message based on content keywords
 */
function categorizePulse(message: string): PulseCategory {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('insight') || lowerMessage.includes('notice') || lowerMessage.includes('interesting')) {
    return 'insight';
  } else if (lowerMessage.includes('remember') || lowerMessage.includes('don\'t forget') || lowerMessage.includes('reminder')) {
    return 'reminder';
  } else if (lowerMessage.includes('trend') || lowerMessage.includes('increasing') || lowerMessage.includes('pattern')) {
    return 'trend';
  } else {
    return 'recap';
  }
}

/**
 * Get icon and color for pulse category
 */
function getCategoryStyle(category: PulseCategory): {
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
} {
  switch (category) {
    case 'insight':
      return {
        icon: <Lightbulb className="w-5 h-5" />,
        colorClass: 'text-yellow-600 dark:text-yellow-400',
        bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
      };
    case 'reminder':
      return {
        icon: <Clock className="w-5 h-5" />,
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      };
    case 'trend':
      return {
        icon: <TrendingUp className="w-5 h-5" />,
        colorClass: 'text-green-600 dark:text-green-400',
        bgClass: 'bg-green-50 dark:bg-green-900/20',
      };
    case 'recap':
      return {
        icon: <Activity className="w-5 h-5" />,
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      };
  }
}

export function PulseSection({ pulses, isLoading = false }: PulseSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">💓</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Pulse
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">💓</span>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Pulse
        </h2>
      </div>

      <AnimatePresence mode="popLayout">
        {pulses.length === 0 ? (
          <EmptyState key="empty" />
        ) : (
          <div className="space-y-3">
            {pulses.map((pulse, index) => (
              <PulseItem
                key={pulse.id}
                pulse={pulse}
                index={index}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        No Pulse Data Yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Your activity insights will appear here as you continue working
      </p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">
        Keep focusing to generate pulse data and insights
      </p>
    </motion.div>
  );
}

// Pulse Item Component
interface PulseItemProps {
  pulse: Pulse;
  index: number;
}

function PulseItem({ pulse, index }: PulseItemProps) {
  const category = categorizePulse(pulse.message);
  const { icon, colorClass, bgClass } = getCategoryStyle(category);
  const relativeTime = formatRelativeTime(pulse.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
      }}
      whileHover={{ scale: 1.02 }}
      className={`${bgClass} rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div
          className={`flex-shrink-0 ${colorClass} mt-0.5`}
          aria-label={`${category} pulse`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
            {pulse.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {relativeTime}
            </span>
            <span className={`text-xs ${colorClass} font-medium capitalize`}>
              {category}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
