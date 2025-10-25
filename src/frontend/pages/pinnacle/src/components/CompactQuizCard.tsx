/**
 * CompactQuizCard - Streamlined quiz for dashboard
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '../../../../../db/models/quiz-questions';

interface CompactQuizCardProps {
  questions: QuizQuestion[];
  unansweredQuestions: QuizQuestion[];
  isLoading?: boolean;
  onAnswerSubmit: (questionId: string) => void;
}

export function CompactQuizCard({
  questions,
  unansweredQuestions,
  isLoading = false,
  onAnswerSubmit,
}: CompactQuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<1 | 2 | null>(null);

  const currentQuestion = unansweredQuestions[currentIndex];
  const answeredCount = questions.length - unansweredQuestions.length;

  const handleAnswer = useCallback(
    (answer: 1 | 2) => {
      if (feedback || !currentQuestion) return;

      setSelectedAnswer(answer);
      const isCorrect = answer === currentQuestion.correct_answer;
      setFeedback({ show: true, isCorrect });

      setTimeout(() => {
        onAnswerSubmit(currentQuestion.id);
        setFeedback(null);
        setSelectedAnswer(null);
        if (currentIndex >= unansweredQuestions.length - 1) {
          setCurrentIndex(0);
        }
      }, 1500);
    },
    [currentQuestion, feedback, onAnswerSubmit, currentIndex, unansweredQuestions.length]
  );

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-800/50">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-800/50 shadow-lg"
    >
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              All done!
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Great work on {answeredCount} questions
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
              {currentQuestion.question}
            </p>

            <div className="space-y-2">
              {[1, 2].map((num) => {
                const option = num === 1 ? currentQuestion.option_1 : currentQuestion.option_2;
                const isSelected = selectedAnswer === num;
                const isCorrect = currentQuestion.correct_answer === num;
                const showFeedback = feedback?.show || false;

                let buttonClass = 'w-full text-left p-2.5 rounded-lg border text-sm transition-all ';
                if (showFeedback) {
                  if (isSelected && isCorrect) {
                    buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100';
                  } else if (isSelected && !isCorrect) {
                    buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100';
                  } else if (isCorrect) {
                    buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100';
                  } else {
                    buttonClass += 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400';
                  }
                } else {
                  buttonClass += 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
                }

                return (
                  <button
                    key={num}
                    onClick={() => handleAnswer(num as 1 | 2)}
                    disabled={feedback !== null}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        showFeedback && isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {num}
                      </div>
                      <span className="flex-1 truncate">{option}</span>
                      {showFeedback && isCorrect && <span>✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {feedback?.show && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs font-medium ${
                  feedback.isCorrect
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {feedback.isCorrect ? '✓ Correct!' : '✗ Not quite'}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
