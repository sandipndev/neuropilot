/**
 * CompactQuizCard - Streamlined quiz for dashboard
 */

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { QuizQuestionWithId } from "../hooks/useQuizQuestions"

type QuizQuestion = QuizQuestionWithId

// Shuffle options for a question to randomize order
function shuffleOptions(
  question: QuizQuestion
): { option: string; isCorrect: boolean; originalIndex: 1 | 2 }[] {
  const options = [
    {
      option: question.option_1,
      isCorrect: question.correct_answer === 1,
      originalIndex: 1 as 1 | 2
    },
    {
      option: question.option_2,
      isCorrect: question.correct_answer === 2,
      originalIndex: 2 as 1 | 2
    }
  ]

  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  return options
}

interface CompactQuizCardProps {
  questions: QuizQuestion[]
  unansweredQuestions: QuizQuestion[]
  isLoading?: boolean
  onAnswerSubmit: (questionId: string) => void
}

export function CompactQuizCard({
  questions,
  unansweredQuestions,
  isLoading = false,
  onAnswerSubmit
}: CompactQuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [feedback, setFeedback] = useState<{
    show: boolean
    isCorrect: boolean
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionQuestionsAnswered, setSessionQuestionsAnswered] = useState(0)
  const previousUnansweredCount = useRef(unansweredQuestions.length)
  const initialAnsweredCount = useRef(
    questions.length - unansweredQuestions.length
  )

  const currentQuestion = unansweredQuestions[currentIndex]
  const answeredCount = questions.length - unansweredQuestions.length

  // Detect if user just completed questions in this session
  const justCompletedSession =
    sessionQuestionsAnswered > 0 && unansweredQuestions.length === 0

  // Reset session score when new questions become available
  useEffect(() => {
    if (unansweredQuestions.length > previousUnansweredCount.current) {
      // New questions added, reset session
      setSessionScore(0)
      setSessionQuestionsAnswered(0)
      initialAnsweredCount.current = answeredCount
    }
    previousUnansweredCount.current = unansweredQuestions.length
  }, [unansweredQuestions.length, answeredCount])

  // Shuffle options for current question (memoized to prevent re-shuffling on re-renders)
  const shuffledOptions = useMemo(
    () => (currentQuestion ? shuffleOptions(currentQuestion) : []),
    [currentQuestion?.id]
  )

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (feedback || !currentQuestion) return

      setSelectedAnswer(optionIndex)
      const selectedOption = shuffledOptions[optionIndex]
      const isCorrect = selectedOption.isCorrect
      setFeedback({ show: true, isCorrect })

      // Update session score and count
      if (isCorrect) {
        setSessionScore((prev) => prev + 1)
      }
      setSessionQuestionsAnswered((prev) => prev + 1)

      setTimeout(() => {
        onAnswerSubmit(String(currentQuestion.id))
        setFeedback(null)
        setSelectedAnswer(null)
        if (currentIndex >= unansweredQuestions.length - 1) {
          setCurrentIndex(0)
        }
      }, 1500)
    },
    [
      currentQuestion,
      feedback,
      onAnswerSubmit,
      currentIndex,
      unansweredQuestions.length,
      shuffledOptions
    ]
  )

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-gray-900/90 dark:to-blue-950/50 backdrop-blur-xl rounded-3xl p-8 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/50 transition-all">
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Quick Quiz
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Test your knowledge
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {answeredCount}/{questions.length}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              completed
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {unansweredQuestions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-10">
            {justCompletedSession ? (
              // Show score if user just completed a quiz session
              <>
                <div className="text-7xl mb-4">🎉</div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Quiz Complete!
                </p>
                <div className="mb-4">
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl">
                    <span className="text-4xl font-bold text-white">
                      {sessionScore}
                    </span>
                    <span className="text-xl text-white/90">/</span>
                    <span className="text-2xl font-semibold text-white/90">
                      {sessionQuestionsAnswered}
                    </span>
                  </div>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300 mb-3 font-semibold">
                  {sessionScore === sessionQuestionsAnswered
                    ? "🌟 Perfect score! Amazing!"
                    : sessionScore >= sessionQuestionsAnswered * 0.8
                      ? "🎯 Excellent work!"
                      : sessionScore >= sessionQuestionsAnswered * 0.6
                        ? "👍 Good job!"
                        : "💪 Keep practicing!"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total progress: {answeredCount}/{questions.length}
                </p>
              </>
            ) : (
              // Show "all caught up" message if no questions in current session
              <>
                <div className="text-6xl mb-4">✨</div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  All caught up!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  You've answered all available questions.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
                  Check back later for more! 🔄
                </p>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5">
            {/* Question */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-5 border border-blue-200/30 dark:border-blue-800/30">
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {shuffledOptions.map((optionData, index) => {
                const isSelected = selectedAnswer === index
                const isCorrect = optionData.isCorrect
                const showFeedback = feedback?.show || false

                let buttonClass =
                  "w-full text-left p-4 rounded-xl border-2 text-sm transition-all transform hover:scale-[1.02] "
                if (showFeedback) {
                  if (isSelected && isCorrect) {
                    buttonClass +=
                      "border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-900 dark:text-green-100 shadow-lg"
                  } else if (isSelected && !isCorrect) {
                    buttonClass +=
                      "border-red-500 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 text-red-900 dark:text-red-100 shadow-lg"
                  } else if (isCorrect) {
                    buttonClass +=
                      "border-green-500 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 text-green-900 dark:text-green-100 shadow-lg"
                  } else {
                    buttonClass +=
                      "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 opacity-60"
                  }
                } else {
                  buttonClass +=
                    "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer shadow-md hover:shadow-lg"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={feedback !== null}
                    className={buttonClass}>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          showFeedback && isCorrect
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                        }`}>
                        {showFeedback && isCorrect ? "✓" : index + 1}
                      </div>
                      <span className="flex-1 font-medium">
                        {optionData.option}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Feedback Message */}
            {feedback?.show && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center py-3 px-4 rounded-xl font-semibold text-sm ${
                  feedback.isCorrect
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                {feedback.isCorrect ? "✓ Correct! Great job!" : "✗ Not quite, try again next time!"}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
