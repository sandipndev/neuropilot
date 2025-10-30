import { useEffect, useState } from "react"

import Chat from "./components/Chat"
import { CompactFocusCard } from "./components/CompactFocusCard"
import { CompactPulseCard } from "./components/CompactPulseCard"
import { CompactQuizCard } from "./components/CompactQuizCard"
import { CompactStatsCard } from "./components/CompactStatsCard"
import { Header } from "./components/Header"
import { JourneyGraph } from "./components/JourneyGraph"
import Settings from "./components/Settings"
import { useFocusData } from "./hooks/useFocusData"
import { usePulseData } from "./hooks/usePulseData"
import { useQuizQuestions } from "./hooks/useQuizQuestions"
import { useWinsData } from "./hooks/useWinsData"

import "./index.css"

import { useStorage } from "@plasmohq/storage/hook"

import { USER_NAME_KEY } from "~tabs/welcome/api/user-data"

type TabType = "dashboard" | "journey" | "settings" | "chat"

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")

  // Fetch focus data
  const { currentFocus, focusHistory, isLoading: focusLoading } = useFocusData()

  // Fetch wins data
  const { wins, isLoading: winsLoading } = useWinsData()

  // Fetch quiz questions
  const {
    questions,
    unansweredQuestions,
    isLoading: quizLoading,
    markAsAnswered
  } = useQuizQuestions()

  // Fetch pulse data
  const { pulses, isLoading: pulseLoading } = usePulseData()

  // Trigger celebration for milestones
  useEffect(() => {
    if (focusHistory.length > 0) {
      const totalSessions = focusHistory.length
      if ([5, 10, 25, 50, 100].includes(totalSessions)) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
      }
    }
  }, [focusHistory.length])

  const [userName] = useStorage(USER_NAME_KEY)

  console.log("userName", userName)

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("pinnacle:theme")
    const prefersDark =
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDarkMode(prefersDark)

    // Apply theme to document
    if (prefersDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const handleSettingsClick = () => {
    setActiveTab("settings")
  }

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)

    // Save to localStorage
    localStorage.setItem("pinnacle:theme", newTheme ? "dark" : "light")

    // Apply to document
    if (newTheme) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Celebration Confetti */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          {/* <div className="text-8xl animate-bounce">🎉</div> */}
        </div>
      )}

      <Header
        userName={userName}
        onSettingsClick={handleSettingsClick}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "dashboard"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}>
              Dashboard
              {activeTab === "dashboard" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("journey")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "journey"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}>
              Journey
              {activeTab === "journey" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "settings"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}>
              Settings
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-6 py-3 font-medium text-sm transition-all relative ${
                activeTab === "chat"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}>
              Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <div className="h-full p-6">
            <div className="h-full max-w-[1600px] mx-auto grid grid-cols-12 gap-5">
              {/* Left Column - Focus & Activity */}
              <div className="col-span-5 flex flex-col gap-5 overflow-y-auto scrollbar-thin">
                <CompactFocusCard
                  currentFocus={currentFocus}
                  focusHistory={focusHistory}
                  isLoading={focusLoading}
                />
                <CompactPulseCard pulses={pulses} isLoading={pulseLoading} />
              </div>

              {/* Right Column - Quiz & Stats */}
              <div className="col-span-7 flex flex-col gap-5 overflow-y-auto scrollbar-thin">
                <CompactQuizCard
                  questions={questions}
                  unansweredQuestions={unansweredQuestions}
                  isLoading={quizLoading}
                  onAnswerSubmit={markAsAnswered}
                />
                <CompactStatsCard
                  focusHistory={focusHistory}
                  wins={wins}
                  isLoading={focusLoading || winsLoading}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "journey" && (
          <div className="h-full p-6 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
              <JourneyGraph />
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="h-full overflow-y-auto">
            <Settings />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="h-full bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-950 dark:to-slate-950">
            <Chat />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
