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

import { useStorage } from "@plasmohq/storage/hook"

import { USER_NAME_KEY } from "~tabs/welcome/api/user-data"

function App() {
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

  const [userName, _] = useStorage(USER_NAME_KEY)

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
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html")
    })
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
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}

      <Header
        userName={userName}
        onSettingsClick={handleSettingsClick}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />

      {/* Main Dashboard */}
      <main className="flex-1 overflow-hidden p-6">
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
      </main>
    </div>
  )
}

export default App
