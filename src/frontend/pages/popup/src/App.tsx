import { useState, useEffect, useMemo, useCallback } from "react";
import { TreeAnimationSection } from "./components/TreeAnimationSection";
import { RefresherButton } from "./components/RefresherButton";
import { getCurrentFocusData, getFocusHistory } from "./api/focus";
import { getWinsData } from "./api/wins";
import { getPomodoroState, togglePomodoro } from "./api/pomodoro";
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
    id: "current",
    isActive: false,
    remainingTime: 1500, // 25 minutes in seconds
    state: "idle",
    startTime: null,
    totalPomodoros: 0,
    lastUpdated: Date.now(),
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
        setFocusData(currentFocus);
        setFocusHistory(history);
        setWins(winsData);

        // Fetch pomodoro state separately with error handling
        try {
          const pomodoro = await getPomodoroState();
          if (pomodoro) {
            setPomodoroState(pomodoro);
          }
        } catch (pomodoroError) {
          console.error("Error fetching pomodoro state:", pomodoroError);
        }

        // Check if currentFocus was updated within the last minute
        if (currentFocus) {
          updateTimeSpent(currentFocus);

          const isActive = currentFocus.time_spent[currentFocus.time_spent.length - 1].stop == null;

          if (isActive) {
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
    };
  }, []);

  // Poll pomodoro state every second
  useEffect(() => {
    console.log(`pomodoro...`);
    const interval = setInterval(async () => {
      try {
        const state = await getPomodoroState();
        if (state) {
          setPomodoroState(state);
        }
      } catch (error) {
        console.error("Error fetching pomodoro state:", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePomodoroToggle = useCallback(async () => {
    try {
      const newState = await togglePomodoro();
      if (newState) {
        setPomodoroState(newState);
      }
    } catch (error) {
      console.error("Error toggling pomodoro:", error);
    }
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
    if (!pomodoroState) {
      return "25:00";
    }
    const minutes = Math.floor(pomodoroState.remainingTime / 60);
    const seconds = pomodoroState.remainingTime % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [pomodoroState]);

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

      <div className="h-full overflow-y-auto relative z-10 flex flex-col">
        {/* Main Card Container */}
        <div className="m-4 border-gray-900 overflow-hidden transition-all duration-300 animate-fade-in flex-shrink-0">
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
                      aria-labl={`Pomodoro timer: ${formattedPomodoroTime} remaining`}
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
                <p className="mb-2">
                  {focusHistory.length >= 1 ? (
                    <>
                      <p className="font-semibold mb-2">We know you learnt a lot about: </p>
                      <div className="space-y-1 text-xs text-gray-500 italic pl-3 border-blue-200">
                        {focusHistory.slice(0, 5).map((item) => (
                          <p key={item.id}>{item.focus_item}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div>You don't have enough focus items 😭.</div>
                      <div className="text-xs text-gray-500">
                        Once you have enough focus items, you can take a refresher.
                      </div>
                    </div>
                  )}
                </p>
              </div>
              <RefresherButton isDisabled={focusHistory.length < 1} />
            </div>
          </div>

          {/* Wins Section */}
          <div className="p-6 border-t border-gray-900">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Wins</p>
            {wins.length === 0 ? (
              <div className="text-sm text-gray-500 italic py-2">No wins yet.</div>
            ) : (
              <div className="flex flex-wrap gap-3 text-sm">
                {wins.slice(0, 3).map((win, index) => (
                  <div
                    key={win.id}
                    className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border-2 border-gray-900 shadow-sm hover:shadow-md transition-all hover:scale-105 hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {getWinIcon(win.type)}
                    <span className="font-bold text-gray-900 text-sm">
                      {win.focusItem.split(" ").join("").toUpperCase()}
                    </span>
                    <span className="text-gray-500 font-mono text-xs">
                      {Math.floor(win.totalTimeSpent / 60000)}:
                      {((win.totalTimeSpent % 60000) / 1000).toString().padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs mt-auto text-center text-gray-500 italic px-4 pb-4">
          🌱 Your focus nurtures growth — watch your tree flourish with every session.
        </p>
      </div>
    </div>
  );
}

export default App;
