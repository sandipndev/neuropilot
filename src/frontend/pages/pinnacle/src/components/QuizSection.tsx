/**
 * QuizSection Component
 * Displays quiz questions for knowledge recall testing
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '../../../../../db/models/quiz-questions';

interface QuizSectionProps {
  questions: QuizQuestion[];
  unansweredQuestions: QuizQuestion[];
  isLoading?: boolean;
  onAnswerSubmit: (questionId: string) => void;
}

type FeedbackState = {
  show: boolean;
  isCorrect: boolean;
} | null;

export function QuizSection({
  questions,
  unansweredQuestions,
  isLoading = false,
  onAnswerSubmit,
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<1 | 2 | null>(null);

  const currentQuestion = unansweredQuestions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = totalQuestions - unansweredQuestions.length;

  const handleAnswerSelect = useCallback(
    (answer: 1 | 2) => {
      if (feedback || !currentQuestion) return;

      setSelectedAnswer(answer);
      const isCorrect = answer === currentQuestion.correct_answer;

      // Show immediate feedback
      setFeedback({
        show: true,
        isCorrect,
      });

      // Mark as answered and move to next question after delay
      setTimeout(() => {
        onAnswerSubmit(currentQuestion.id);
        setFeedback(null);
        setSelectedAnswer(null);

        // Move to next question or stay at current index if it's the last one
        if (currentQuestionIndex >= unansweredQuestions.length - 1) {
          setCurrentQuestionIndex(0);
        }
      }, 2000);
    },
    [currentQuestion, feedback, onAnswerSubmit, currentQuestionIndex, unansweredQuestions.length]
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          >
            🧠
          </motion.span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Knowledge Recall
          </h2>
        </div>
        <div className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-full border border-blue-200/50 dark:border-blue-800/50">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {answeredCount} / {totalQuestions}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {unansweredQuestions.length === 0 ? (
          <EmptyState key="empty" totalAnswered={answeredCount} />
        ) : (
          <QuizQuestionDisplay
            key={currentQuestion.id}
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            feedback={feedback}
            onAnswerSelect={handleAnswerSelect}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Empty State Component
interface EmptyStateProps {
  totalAnswered: number;
}

function EmptyState({ totalAnswered }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="text-center py-8"
    >
      <motion.div 
        className="text-6xl mb-4"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 2
        }}
      >
        🎉
      </motion.div>
      <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
        All Caught Up!
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {totalAnswered > 0
          ? `You've answered all ${totalAnswered} questions. Great work!`
          : 'No quiz questions available yet.'}
      </p>
      <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">
        New questions will appear as you continue your focus sessions
      </p>
    </motion.div>
  );
}

// Quiz Question Display Component
interface QuizQuestionDisplayProps {
  question: QuizQuestion;
  selectedAnswer: 1 | 2 | null;
  feedback: FeedbackState;
  onAnswerSelect: (answer: 1 | 2) => void;
}

function QuizQuestionDisplay({
  question,
  selectedAnswer,
  feedback,
  onAnswerSelect,
}: QuizQuestionDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3">
        <AnswerButton
          option={question.option_1}
          optionNumber={1}
          isSelected={selectedAnswer === 1}
          isCorrect={question.correct_answer === 1}
          showFeedback={feedback?.show || false}
          disabled={feedback !== null}
          onClick={() => onAnswerSelect(1)}
        />
        <AnswerButton
          option={question.option_2}
          optionNumber={2}
          isSelected={selectedAnswer === 2}
          isCorrect={question.correct_answer === 2}
          showFeedback={feedback?.show || false}
          disabled={feedback !== null}
          onClick={() => onAnswerSelect(2)}
        />
      </div>

      {/* Feedback Message */}
      <AnimatePresence>
        {feedback?.show && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {feedback.isCorrect ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                  className="text-2xl"
                >
                  ✓
                </motion.span>
                <span className="font-medium">Correct! Well done!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <span className="text-2xl">✗</span>
                <span className="font-medium">Not quite. Keep learning!</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Animation for Correct Answers */}
      <AnimatePresence>
        {feedback?.show && feedback.isCorrect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
          >
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 1],
                  x: Math.cos((i * Math.PI * 2) / 6) * 100,
                  y: Math.sin((i * Math.PI * 2) / 6) * 100,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute text-2xl"
              >
                ⭐
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Answer Button Component
interface AnswerButtonProps {
  option: string;
  optionNumber: 1 | 2;
  isSelected: boolean;
  isCorrect: boolean;
  showFeedback: boolean;
  disabled: boolean;
  onClick: () => void;
}

function AnswerButton({
  option,
  optionNumber,
  isSelected,
  isCorrect,
  showFeedback,
  disabled,
  onClick,
}: AnswerButtonProps) {
  // Determine button styling based on state
  let buttonClasses =
    'w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ';

  if (showFeedback) {
    if (isSelected) {
      if (isCorrect) {
        // Selected and correct
        buttonClasses +=
          'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100';
      } else {
        // Selected but incorrect
        buttonClasses +=
          'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100';
      }
    } else if (isCorrect) {
      // Not selected but is the correct answer
      buttonClasses +=
        'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100';
    } else {
      // Not selected and not correct
      buttonClasses +=
        'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500';
    }
  } else {
    // Default state (no feedback)
    buttonClasses +=
      'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
  }

  if (disabled) {
    buttonClasses += ' cursor-not-allowed';
  }

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            showFeedback && isSelected && isCorrect
              ? 'bg-green-500 text-white'
              : showFeedback && isSelected && !isCorrect
              ? 'bg-red-500 text-white'
              : showFeedback && isCorrect
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {optionNumber}
        </div>
        <span className="flex-1">{option}</span>
        {showFeedback && isCorrect && (
          <span className="text-xl">✓</span>
        )}
        {showFeedback && isSelected && !isCorrect && (
          <span className="text-xl">✗</span>
        )}
      </div>
    </motion.button>
  );
}
