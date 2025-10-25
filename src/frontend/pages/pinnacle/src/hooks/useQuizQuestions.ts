/**
 * useQuizQuestions Hook
 * Fetches quiz questions and filters out answered ones using localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import { getQuizQuestions } from '../../../../../api/queries/quiz-questions';
import type { QuizQuestion } from '../../../../../db/models/quiz-questions';
import {
  markQuestionAsAnswered,
  filterUnansweredQuestions,
} from '../lib/quiz-tracking';

interface UseQuizQuestionsReturn {
  questions: QuizQuestion[];
  unansweredQuestions: QuizQuestion[];
  isLoading: boolean;
  error: Error | null;
  markAsAnswered: (questionId: string) => void;
}

export function useQuizQuestions(): UseQuizQuestionsReturn {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      try {
        setIsLoading(true);
        const data = await getQuizQuestions();

        if (isMounted) {
          setQuestions(data);
          setUnansweredQuestions(filterUnansweredQuestions(data));
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch quiz questions'));
          console.error('Error fetching quiz questions:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, []);

  const markAsAnswered = useCallback((questionId: string) => {
    markQuestionAsAnswered(questionId);
    setUnansweredQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  return { questions, unansweredQuestions, isLoading, error, markAsAnswered };
}
