import { useState, useEffect } from 'react';
import { Settings, Moon, Sun } from 'lucide-react';
import { formatTime } from '../lib/time';

interface HeaderProps {
  userName: string | null;
  onSettingsClick: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export function Header({ userName, onSettingsClick, onThemeToggle, isDarkMode }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const displayName = userName || 'there';

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: User Greeting */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Hi {displayName} 👋
          </h1>
        </div>

        {/* Center: Website Summaries placeholder */}
        <div className="flex-1 flex justify-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {/* Website Summaries section will go here */}
          </span>
        </div>

        {/* Right: Controls and Time */}
        <div className="flex items-center gap-4">
          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          {/* Current Time */}
          <div className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </header>
  );
}
