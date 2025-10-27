/**
 * useQuizQuestions Hook
 * Fetches quiz questions and filters out answered ones using localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import db, { type QuizQuestion } from '~/db';
import {
  markQuestionAsAnswered,
  filterUnansweredQuestions,
} from '../lib/quiz-tracking';

export interface QuizQuestionWithId extends QuizQuestion {
  id?: number;
}

interface UseQuizQuestionsReturn {
  questions: QuizQuestionWithId[];
  unansweredQuestions: QuizQuestionWithId[];
  isLoading: boolean;
  error: Error | null;
  markAsAnswered: (questionId: string) => void;
}

export function useQuizQuestions(): UseQuizQuestionsReturn {
  const [questions, setQuestions] = useState<QuizQuestionWithId[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<QuizQuestionWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchQuestions() {
      try {
        setIsLoading(true);
        
        // Get quiz questions from database, sorted by timestamp descending
        const data = await db.quizQuestions
          .orderBy('timestamp')
          .reverse()
          .toArray();

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
    setUnansweredQuestions(prev => prev.filter(q => String(q.id) !== questionId));
  }, []);

  return { questions, unansweredQuestions, isLoading, error, markAsAnswered };
}
