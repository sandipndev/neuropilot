import { useLiveQuery } from "dexie-react-hooks"
import {
  Award,
  BarChart3,
  Compass,
  Flame,
  Lightbulb,
  Target,
  Trophy
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Storage } from "@plasmohq/storage"

import db, { type Focus, type PomodoroState } from "~db"
import { INTENT_QUEUE_NOTIFY } from "~default-settings"

import { parseFocus, type FocusWithParsedData } from "./api/focus"
import { getPomodoroState, togglePomodoro } from "./api/pomodoro"
import { getWinsData } from "./api/wins"
import { IntentsTab } from "./components/IntentsTab"
import { TreeAnimationSection } from "./components/TreeAnimationSection"
import type { WinItem } from "./types/wins"

import "./index.css"

import { Chat } from "~options/chat/chat"

type TabType = "focus" | "insights" | "explore" | "intents"

const generateChatId = () =>
  `chat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

const storage = new Storage()

const Popup = () => {
  const [activeTab, setActiveTab] = useState<TabType>("focus")
  const [focusData, setFocusData] = useState<FocusWithParsedData | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string>(generateChatId())

  const focusDataDex = useLiveQuery(() => {
    return db.table<Focus>("focus").toArray()
  }, [])

  useEffect(() => {
    if (!focusDataDex || focusDataDex.length === 0) {
      setFocusData(null)
      return
    }

    let interval: number | null = null

    const currentFocus = [...focusDataDex].sort(
      (a, b) => b.last_updated - a.last_updated
    )[0]

    console.log(currentFocus)

    // Check if the focus session is currently active
    const lastSession =
      currentFocus.time_spent[currentFocus.time_spent.length - 1]
    const isActive = lastSession && lastSession.end === null

    if (isActive) {
      // Only set focusData if there's an active session
      const parsedFocus = parseFocus(currentFocus)
      setFocusData(parsedFocus)
      updateTimeSpent(parsedFocus)

      // update the time spent every second
      interval = setInterval(() => {
        updateTimeSpent(parseFocus(currentFocus))
      }, 1000) as unknown as number
    } else {
      // No active session, clear focusData
      setFocusData(null)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [focusDataDex])

  const [wins, setWins] = useState<WinItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
    id: "current",
    isActive: false,
    remainingTime: 1500,
    state: "idle",
    startTime: null,
    totalPomodoros: 0,
    lastUpdated: Date.now()
  })

  // Watch for intent queue changes and switch to Intents tab
  useEffect(() => {
    storage.watch({
      [INTENT_QUEUE_NOTIFY]: ({ newValue }) => {
        console.log("Intent queue notify received", newValue)
        setActiveTab("intents")
      }
    })
  }, [])
  const [formattedFocusTime, setFormattedFocusTime] = useState("00:00:00")

  const updateTimeSpent = (focusData: FocusWithParsedData) => {
    const totalTime = focusData.total_time
    const hours = Math.floor(totalTime / 3600000)
    const minutes = Math.floor((totalTime % 3600000) / 60000)
    const seconds = Math.floor((totalTime % 60000) / 1000)
    const strxx = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

    setFormattedFocusTime(strxx)
  }

  console.log(`Yoo`)
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [winsData] = await Promise.all([getWinsData()])

        setWins(winsData)

        console.log("currentFocus", winsData)

        // Fetch pomodoro state separately with error handling
        try {
          const pomodoro = await getPomodoroState()
          if (pomodoro) {
            setPomodoroState(pomodoro)
          }
        } catch (pomodoroError) {
          console.error("Error fetching pomodoro state:", pomodoroError)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        console.log(`Initial data Loaded...`)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Poll pomodoro state every second
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const state = await getPomodoroState()
        if (state) {
          setPomodoroState(state)
        }
      } catch (error) {
        console.error("Error fetching pomodoro state:", error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handlePomodoroToggle = useCallback(async () => {
    try {
      const newState = await togglePomodoro()
      if (newState) {
        setPomodoroState(newState)
      }
    } catch (error) {
      console.error("Error toggling pomodoro:", error)
    }
  }, [])

  const getWinIcon = useCallback((type: string) => {
    switch (type) {
      case "milestone":
        return <Trophy className="w-4 h-4 text-yellow-600" />
      case "streak":
        return <Flame className="w-4 h-4 text-orange-600" />
      case "achievement":
        return <Award className="w-4 h-4 text-blue-600" />
      default:
        return <Trophy className="w-4 h-4 text-gray-600" />
    }
  }, [])

  const formattedPomodoroTime = useMemo(() => {
    if (!pomodoroState) {
      return "25:00"
    }
    const minutes = Math.floor(pomodoroState.remainingTime / 60)
    const seconds = pomodoroState.remainingTime % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }, [pomodoroState])

  const renderFocusTab = () => (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Tree Nurturing Message */}
      <div className="px-4 py-2 bg-green-50/40 dark:bg-green-900/20 border-b border-green-200/30 dark:border-green-800/30">
        <p className="text-xs text-green-700 dark:text-green-300 text-center">
          🌱 Your tree grows as you focus more. Keep nurturing it!
        </p>
      </div>

      <Chat
        chatId={currentChatId}
        isNewChat={true}
        onChatCreated={(id) => setCurrentChatId(id)}
      />

      {/* Link to Options Page */}
      <div className="px-4 pt-2 bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30">
        <button
          onClick={() => chrome.tabs.create({ url: "/options.html" })}
          className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline text-center py-1">
          View all previous chats and more →
        </button>
      </div>
    </div>
  )

  const activitySummaries = useLiveQuery(() => {
    return db
      .table("activitySummary")
      .orderBy("timestamp")
      .reverse()
      .limit(5)
      .toArray()
  }, [])

  const renderInsightsTab = () => (
    <div className="flex-1 overflow-y-auto p-2 space-y-4">
      {/* Refresher Quiz Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100/80 dark:bg-purple-900/40 backdrop-blur-sm rounded-lg border border-purple-200/50 dark:border-purple-800/50">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Refresher Quiz
          </h3>
        </div>
        {focusDataDex && focusDataDex.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You've learnt a lot recently... let's take a refresher! 🧠
            </p>
            <button
              onClick={() => {
                chrome.tabs.create({ url: "/tabs/dashboard.html" })
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg">
              Start Refresher Quiz
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-2">
            <p className="mb-2">
              It will get active once you've enough focus 😔
            </p>
            <p className="text-xs italic">
              Complete some focus sessions to unlock the quiz
            </p>
          </div>
        )}
      </div>

      {/* Activity Summaries Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Activity Summaries
          </h3>
        </div>
        {activitySummaries && activitySummaries.length > 0 ? (
          <div className="space-y-3">
            {activitySummaries.map((summary, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-slate-600/40 backdrop-blur-sm p-4 rounded-lg border border-gray-300/50 dark:border-slate-500/50 shadow-md">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {summary.summary}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(summary.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">No activity summaries yet</p>
            <p className="text-xs italic">
              Start browsing to see AI-powered insights
            </p>
          </div>
        )}
      </div>

      {/* Focus History Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100/80 dark:bg-green-900/40 backdrop-blur-sm rounded-lg border border-green-200/50 dark:border-green-800/50">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Recent Focus Sessions
          </h3>
        </div>
        {focusDataDex && focusDataDex.length > 0 ? (
          <div className="space-y-2">
            {focusDataDex.slice(0, 5).map((focus) => {
              const parsed = parseFocus(focus)
              return (
                <div
                  key={focus.id}
                  className="bg-white/50 dark:bg-slate-600/40 backdrop-blur-sm p-3 rounded-lg border border-gray-300/50 dark:border-slate-500/50 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {focus.item}
                    </p>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {Math.floor(parsed.total_time / 3600000)}h{" "}
                      {Math.floor((parsed.total_time % 3600000) / 60000)}m
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">No focus sessions yet</p>
            <p className="text-xs italic">
              Start focusing to track your learning journey
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderExploreTab = () => (
    <div className="flex-1 overflow-y-auto p-2 space-y-4">
      {/* Wins Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100/80 dark:bg-yellow-900/40 backdrop-blur-sm rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Wins
          </h3>
        </div>
        {wins.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
            No wins yet. Keep focusing to unlock achievements!
          </div>
        ) : (
          <div className="space-y-3">
            {wins.map((win, index) => (
              <div
                key={win.id}
                className="flex items-center gap-3 bg-white/50 dark:bg-slate-600/40 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-300/50 dark:border-slate-500/50 hover:shadow-lg hover:border-gray-400/60 dark:hover:border-slate-400/60 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}>
                {getWinIcon(win.type)}
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {win.focusItem}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {win.text}
                  </p>
                </div>
                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">
                  {Math.floor(win.totalTimeSpent / 60000)}:
                  {((win.totalTimeSpent % 60000) / 1000)
                    .toString()
                    .padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 backdrop-blur-md rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100/80 dark:bg-purple-900/40 backdrop-blur-sm rounded-lg border border-purple-200/50 dark:border-purple-800/50">
            <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Milestones
          </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">Coming soon: Track your learning milestones</p>
          <p className="text-xs italic">
            Celebrate your progress and achievements
          </p>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Emerald Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
        radial-gradient(125% 125% at 50% 90%, #ffffff 50%, #10b981 100%)
      `,
          backgroundSize: "100% 100%",
          filter: "hue-rotate(60deg)"
        }}
      />

      <div
        className="relative h-screen overflow-hidden flex flex-col"
        role="main"
        id="main-bg-x">
        {/* Tree Animation Background - Full visibility */}
        <TreeAnimationSection totalFocusTime={focusData?.total_time || 0} />

        {/* Content Container with padding for card layout */}

        <div className="relative z-10 flex flex-col h-full gap-4 bg-transparent">
          {/* Header - No Card */}
          <div className="shrink-0 px-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src="/assets/logo_NPxx.png"
                  className="w-20 bg-transparent"
                  style={{
                    filter: "grayscale(100%) contrast(300%) brightness(1%)"
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                {/* Pomodoro Timer */}
                <div className="flex items-center gap-2 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-300/50 dark:border-slate-600/50 shadow-lg">
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {pomodoroState.state === "focus" ? "🍅" : "☕"}{" "}
                    {formattedPomodoroTime}
                  </span>
                  <button
                    onClick={handlePomodoroToggle}
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all hover:scale-110 focus:ring-blue-400 rounded p-1"
                    aria-label={
                      pomodoroState.isActive
                        ? `Pause ${pomodoroState.state}`
                        : `Start ${pomodoroState.state}`
                    }>
                    {pomodoroState.isActive ? "⏸" : "▶️"}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Focus Display */}
            {focusData ? (
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-xl p-3 border border-gray-300/50 dark:border-slate-600/50 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Current Focus
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {focusData.focus_item.replace(".", "")}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      Elapsed
                    </p>
                    <p className="font-mono font-bold text-sm text-gray-900 dark:text-gray-200">
                      {formattedFocusTime}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-xl p-3 border border-gray-300/50 dark:border-slate-600/50 shadow-xs">
                <div className="py-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1 text-center font-medium">
                    No active focus session
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic text-center mb-3">
                    Spend 7 minutes of focus time to learn something new 🌱
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Card with Integrated Tabs */}
          <div className="bg-white/25 dark:bg-slate-800/25 rounded-2xl border border-white/20 dark:border-slate-700/30 flex-1 overflow-hidden flex flex-col">
            {/* Subtle Tab Bar - Horizontally Scrollable */}
            <div className="shrink-0 p-2 border-b border-slate-200 dark:border-slate-700/20 overflow-x-auto scrollbar-hide">
              <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-xl p-1 inline-flex gap-1 mx-auto">
                <button
                  onClick={() => setActiveTab("focus")}
                  className={`relative px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === "focus"
                      ? "bg-white/60 dark:bg-slate-700/60 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-slate-700/30"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Focus</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`relative px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === "insights"
                      ? "bg-white/60 dark:bg-slate-700/60 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-slate-700/30"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Insights</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("intents")}
                  className={`relative px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === "intents"
                      ? "bg-white/60 dark:bg-slate-700/60 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-slate-700/30"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Intents</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("explore")}
                  className={`relative px-5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === "explore"
                      ? "bg-white/60 dark:bg-slate-700/60 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-slate-700/30"
                  }`}>
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Explore</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-scroll py-2">
              {activeTab === "focus" && renderFocusTab()}
              {activeTab === "insights" && renderInsightsTab()}
              {activeTab === "intents" && <IntentsTab />}
              {activeTab === "explore" && renderExploreTab()}
            </div>
          </div>
        </div>
      </div>
      {/* Your Content/Components */}
    </div>
  )
}

export default Popup
