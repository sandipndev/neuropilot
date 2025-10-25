import { Play, Pause, Coffee } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { PomodoroState } from '../types/pomodoro';
import { useNotificationSound } from '../utils/useNotificationSound';

interface PomodoroTimerProps {
  pomodoroState: PomodoroState;
  onToggle: () => void;
}

export function PomodoroTimer({ pomodoroState, onToggle }: PomodoroTimerProps) {
  const { isActive, remainingTime, state } = pomodoroState;
  const lastAnnouncedMinute = useRef<number>(-1);
  const previousRemainingTime = useRef<number>(remainingTime);
  const { playNotificationSound } = useNotificationSound();

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get minutes for screen reader announcements (only when minute changes)
  const currentMinute = Math.floor(remainingTime / 60);
  const shouldAnnounce = currentMinute !== lastAnnouncedMinute.current;
  
  useEffect(() => {
    if (shouldAnnounce) {
      lastAnnouncedMinute.current = currentMinute;
    }
  }, [currentMinute, shouldAnnounce]);

  // Play notification sound when timer completes
  useEffect(() => {
    const wasActive = previousRemainingTime.current > 0;
    const isNowComplete = remainingTime === 0;
    
    if (wasActive && isNowComplete && isActive) {
      playNotificationSound();
    }
    
    previousRemainingTime.current = remainingTime;
  }, [remainingTime, isActive, playNotificationSound]);

  // Get icon based on state
  const getIcon = () => {
    if (state === 'break') {
      return <Coffee className="w-5 h-5" />;
    }
    return isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />;
  };

  // Get aria-label based on state
  const getAriaLabel = (): string => {
    if (state === 'break') {
      return isActive ? 'Stop break timer' : 'Start break timer';
    }
    return isActive ? 'Stop Pomodoro timer' : 'Start Pomodoro timer';
  };

  // Handle keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-label={getAriaLabel()}
        aria-pressed={isActive}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        {getIcon()}
      </button>
      
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wide">
          {state === 'break' ? 'Break' : 'Pomodoro'}
        </span>
        <span className="text-lg font-mono font-semibold text-gray-900">
          {formatTime(remainingTime)}
        </span>
        {/* Screen reader announcement for minute changes only */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {shouldAnnounce && `${currentMinute} minutes remaining`}
        </span>
      </div>
    </div>
  );
}
