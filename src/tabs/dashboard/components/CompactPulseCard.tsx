/**
 * CompactPulseCard - Professional activity timeline
 */

import { Activity, Lightbulb, Clock, TrendingUp, Zap } from 'lucide-react';
import type { Pulse } from '~/db';
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
  const className = "w-4 h-4";
  switch (category) {
    case 'insight': return <Lightbulb className={className} />;
    case 'reminder': return <Clock className={className} />;
    case 'trend': return <TrendingUp className={className} />;
    case 'recap': return <Activity className={className} />;
  }
}

function getCategoryColor(category: PulseCategory) {
  switch (category) {
    case 'insight': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    case 'reminder': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    case 'trend': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'recap': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  }
}

export function CompactPulseCard({ pulses, isLoading = false }: CompactPulseCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  const recentPulses = pulses.slice(0, 6);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Activity Pulse
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {pulses.length} total
        </span>
      </div>

      {recentPulses.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No activity insights yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentPulses.map((pulse, index) => {
            const category = categorizePulse(pulse.message);
            const colorClass = getCategoryColor(category);
            
            return (
              <div
                key={`${pulse.timestamp}-${index}`}
                className="flex gap-3 group"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                    {getCategoryIcon(category)}
                  </div>
                  {index < recentPulses.length - 1 && (
                    <div className="w-px h-full bg-gray-200 dark:bg-gray-800 mt-2" />
                  )}
                </div>
                
                <div className="flex-1 pb-4">
                  <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed mb-1">
                    {pulse.message}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(pulse.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
