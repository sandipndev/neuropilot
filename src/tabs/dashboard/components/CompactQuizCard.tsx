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
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Quick Quiz
          </h3>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
          {answeredCount}/{questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {unansweredQuestions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6">
            {justCompletedSession ? (
              // Show score if user just completed a quiz session
              <>
                <div className="text-5xl mb-3">🎉</div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Quiz Complete!
                </p>
                <div className="mb-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <span className="text-2xl font-bold text-white">
                      {sessionScore}
                    </span>
                    <span className="text-sm text-white/90">/</span>
                    <span className="text-lg font-semibold text-white/90">
                      {sessionQuestionsAnswered}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {sessionScore === sessionQuestionsAnswered
                    ? "🌟 Perfect score!"
                    : sessionScore >= sessionQuestionsAnswered * 0.8
                      ? "🎯 Excellent work!"
                      : sessionScore >= sessionQuestionsAnswered * 0.6
                        ? "👍 Good job!"
                        : "💪 Keep practicing!"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Total progress: {answeredCount}/{questions.length}
                </p>
              </>
            ) : (
              // Show "all caught up" message if no questions in current session
              <>
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  All caught up!
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  You've answered all available questions.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
            className="space-y-3">
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
              {currentQuestion.question}
            </p>

            <div className="space-y-2">
              {shuffledOptions.map((optionData, index) => {
                const isSelected = selectedAnswer === index
                const isCorrect = optionData.isCorrect
                const showFeedback = feedback?.show || false

                let buttonClass =
                  "w-full text-left p-2.5 rounded-lg border text-sm transition-all "
                if (showFeedback) {
                  if (isSelected && isCorrect) {
                    buttonClass +=
                      "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100"
                  } else if (isSelected && !isCorrect) {
                    buttonClass +=
                      "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100"
                  } else if (isCorrect) {
                    buttonClass +=
                      "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100"
                  } else {
                    buttonClass +=
                      "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400"
                  }
                } else {
                  buttonClass +=
                    "border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={feedback !== null}
                    className={buttonClass}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          showFeedback && isCorrect
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}>
                        {index + 1}
                      </div>
                      <span className="flex-1 truncate">
                        {optionData.option}
                      </span>
                      {showFeedback && isCorrect && <span>✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            {feedback?.show && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-medium ${
                  feedback.isCorrect
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                {feedback.isCorrect ? "✓ Correct!" : "✗ Not quite"}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
