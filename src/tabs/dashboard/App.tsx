import { useEffect, useState } from "react"

import { CompactFocusCard } from "./components/CompactFocusCard"
import { CompactPulseCard } from "./components/CompactPulseCard"
import { CompactQuizCard } from "./components/CompactQuizCard"
import { CompactStatsCard } from "./components/CompactStatsCard"
import { Header } from "./components/Header"
import { useFocusData } from "./hooks/useFocusData"
import { usePulseData } from "./hooks/usePulseData"
import { useQuizQuestions } from "./hooks/useQuizQuestions"
import { useWinsData } from "./hooks/useWinsData"

import "./index.css"

function App() {
  const [userName, setUserName] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

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

  // Load user name on mount
  useEffect(() => {
    const name = localStorage.getItem("userName") || "User"
    setUserName(name)
  }, [])

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
    // Placeholder for settings modal
    console.log("Settings clicked")
    // TODO: Implement settings modal
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/20 dark:from-gray-950 dark:via-blue-950/10 dark:to-indigo-950/10 overflow-hidden">
      {/* Celebration Confetti */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}

      <Header
        userName={userName}
        onSettingsClick={handleSettingsClick}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      {/* Main Dashboard - Quiz-Focused Layout */}
      <main className="flex-1 overflow-hidden p-6">
        <div className="h-full max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
          {/* Left Column - Quick Quiz (Hero Section) */}
          <div className="col-span-5 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
            <CompactQuizCard
              questions={questions}
              unansweredQuestions={unansweredQuestions}
              isLoading={quizLoading}
              onAnswerSubmit={markAsAnswered}
            />
            <CompactFocusCard
              currentFocus={currentFocus}
              focusHistory={focusHistory}
              isLoading={focusLoading}
            />
          </div>

          {/* Right Column - Stats & Activity */}
          <div className="col-span-7 flex flex-col gap-6 overflow-y-auto scrollbar-thin">
            <CompactStatsCard
              focusHistory={focusHistory}
              wins={wins}
              isLoading={focusLoading || winsLoading}
            />
            <CompactPulseCard pulses={pulses} isLoading={pulseLoading} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
