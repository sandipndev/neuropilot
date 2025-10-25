import { useState, useEffect, useMemo, useCallback } from "react";
import { TreeAnimationSection } from "./components/TreeAnimationSection";
import { RefresherButton } from "./components/RefresherButton";
import { getCurrentFocusData, getFocusHistory } from "./api/focus";
import { getWinsData } from "./api/wins";
import { calculateTotalTime, type FocusWithParsedData } from "neuropilot-api";
import type { PomodoroState } from "./types/pomodoro";
import type { WinItem } from "./types/wins";
import { Trophy, Flame, Award } from "lucide-react";

function App() {
  const [focusData, setFocusData] = useState<FocusWithParsedData | null>(null);
  const [focusHistory, setFocusHistory] = useState<FocusWithParsedData[]>([]);
  const [wins, setWins] = useState<WinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
    isActive: false,
    remainingTime: 1500, // 25 minutes in seconds
    state: "idle",
    totalPomodoros: 0,
  });
  const [formattedFocusTime, setFormattedFocusTime] = useState("00:00:00");

  const updateTimeSpent = (focusData: FocusWithParsedData) => {
    const totalTime = calculateTotalTime(focusData.time_spent);
    const hours = Math.floor(totalTime / 3600000);
    const minutes = Math.floor((totalTime % 3600000) / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);
    const strxx = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    setFormattedFocusTime(strxx);
  };

  // Fetch data on mount
  useEffect(() => {
    let interval: number | null = null;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [currentFocus, history, winsData] = await Promise.all([
          getCurrentFocusData(),
          getFocusHistory(),
          getWinsData(),
        ]);
        console.log(currentFocus, history, winsData);
        setFocusData(currentFocus);
        setFocusHistory(history);
        setWins(winsData);

        // Check if currentFocus was updated within the last minute
        if (currentFocus) {
          updateTimeSpent(currentFocus);

          const isActive = currentFocus.time_spent[currentFocus.time_spent.length - 1].stop == null;

          if (isActive) {
            console.log(`Updating... ${currentFocus}`)
            // update the time spent
            interval = setInterval(() => {
              updateTimeSpent(currentFocus);
            }, 1000);

          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!pomodoroState.isActive || pomodoroState.remainingTime <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setPomodoroState((prev) => {
        const newRemainingTime = prev.remainingTime - 1;

        // Timer completed
        if (newRemainingTime <= 0) {
          return {
            ...prev,
            remainingTime: 0,
            isActive: false,
          };
        }

        return {
          ...prev,
          remainingTime: newRemainingTime,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroState.isActive, pomodoroState.remainingTime]);

  const handlePomodoroToggle = useCallback(() => {
    setPomodoroState((prev) => {
      // If timer is at 0, reset to 25 minutes
      if (prev.remainingTime === 0) {
        return {
          ...prev,
          isActive: true,
          remainingTime: 1500, // Reset to 25 minutes
          state: "focus",
        };
      }

      // Toggle active state
      return {
        ...prev,
        isActive: !prev.isActive,
        state: prev.isActive ? "idle" : "focus",
      };
    });
  }, []);

  const getWinIcon = useCallback((type: string) => {
    switch (type) {
      case "milestone":
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case "streak":
        return <Flame className="w-4 h-4 text-orange-600" />;
      case "achievement":
        return <Award className="w-4 h-4 text-blue-600" />;
      default:
        return <Trophy className="w-4 h-4 text-gray-600" />;
    }
  }, []);

  const formattedPomodoroTime = useMemo(() => {
    const minutes = Math.floor(pomodoroState.remainingTime / 60);
    const seconds = pomodoroState.remainingTime % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [pomodoroState.remainingTime]);

  console.log(isLoading, focusData);
  if (isLoading) {
    return (
      <div className="w-[400px] h-[600px] flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-[400px] h-[600px] relative overflow-hidden bg-linear-to-br from-gray-50 to-gray-100"
      role="main"
    >
      {/* Tree Animation Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <TreeAnimationSection totalFocusTime={focusData?.total_time || 0} />
      </div>

      <div className="h-full overflow-y-auto relative z-10">
        {/* Main Card Container */}
        <div className="m-4 border-gray-900 overflow-hidden transition-all duration-300 animate-fade-in">
          {/* Current Focus Header */}
          <div
            className="p-6 border-b border-gray-900"
            role="region"
            aria-label="Current focus session"
          >
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Current Focus
            </h2>
            {focusData ? (
              <div className="bg-white border-2 border-gray-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
                <p
                  className="text-lg font-bold text-gray-900 mb-3 leading-tight"
                  aria-live="polite"
                >
                  {focusData.focus_item}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span
                    className="font-mono font-bold text-lg text-gray-800"
                    aria-label={`Focus time: ${formattedFocusTime}`}
                  >
                    {formattedFocusTime}
                  </span>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                    <span
                      className="text-xs text-gray-600 font-medium"
                      aria-label={`Pomodoro timer: ${formattedPomodoroTime} remaining`}
                    >
                      🍅 {formattedPomodoroTime}
                    </span>
                    <button
                      onClick={handlePomodoroToggle}
                      className="text-gray-600 hover:text-gray-900 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 rounded p-1"
                      aria-label={
                        pomodoroState.isActive ? "Pause Pomodoro timer" : "Start Pomodoro timer"
                      }
                      aria-pressed={pomodoroState.isActive}
                    >
                      {pomodoroState.isActive ? "⏸" : "▶️"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                <p className="text-base text-gray-700 mb-2 leading-relaxed">Nothing as of yet...</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  How about we spend just <span className="font-bold text-blue-600">7 minutes</span>{" "}
                  to learn about something new? 🚀
                </p>
              </div>
            )}
          </div>

          {/* Take a Refresher Section */}
          <div className="p-6" role="region" aria-label="Quiz suggestions">
            <div className="space-y-2">
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="font-semibold mb-2">We know you learnt a lot about: </p>
                <div className="space-y-1 text-xs text-gray-500 italic pl-3 border-blue-200">
                  {focusHistory.slice(0, 5).map((item) => (
                    <p key={item.id}>{item.focus_item}</p>
                  ))}
                </div>
              </div>
              <RefresherButton />
            </div>
          </div>

          {/* Wins Section */}
          <div className="p-6 border-t border-gray-900">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Wins</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {wins.slice(0, 3).map((win, index) => (
                <div
                  key={win.id}
                  className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-gray-900 shadow-sm hover:shadow-md transition-all hover:scale-105 hover:-translate-y-0.5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {getWinIcon(win.type)}
                  <span className="font-bold text-gray-900 text-sm">
                    {win.focusItem
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 3)
                      .toUpperCase()}
                  </span>
                  <span className="text-gray-500 font-mono text-xs">
                    {Math.floor(win.totalTimeSpent / 60000)}:
                    {((win.totalTimeSpent % 60000) / 1000).toString().padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
