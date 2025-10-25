/**
 * Quiz Answer Tracking Utilities
 * Manages localStorage for tracking answered quiz questions
 */

import type { QuizQuestion } from '../../../../../db/models/quiz-questions';

const ANSWERED_QUESTIONS_KEY = 'pinnacle_answered_questions';

/**
 * Get answered question IDs from localStorage
 * @returns Set of answered question IDs
 */
export function getAnsweredQuestions(): Set<string> {
  try {
    const stored = localStorage.getItem(ANSWERED_QUESTIONS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (err) {
    console.error('Error reading answered questions from localStorage:', err);
    return new Set();
  }
}

/**
 * Mark a question as answered in localStorage
 * @param questionId - The ID of the question to mark as answered
 */
export function markQuestionAsAnswered(questionId: string): void {
  try {
    const answered = getAnsweredQuestions();
    answered.add(questionId);
    localStorage.setItem(ANSWERED_QUESTIONS_KEY, JSON.stringify([...answered]));
  } catch (err) {
    console.error('Error saving answered question to localStorage:', err);
  }
}

/**
 * Filter out answered questions from a list
 * @param questions - Array of quiz questions
 * @returns Array of unanswered questions
 */
export function filterUnansweredQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const answered = getAnsweredQuestions();
  return questions.filter(q => !answered.has(q.id));
}
