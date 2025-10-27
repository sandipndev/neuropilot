// Shared TypeScript interfaces for Pinnacle Dashboard
// Re-export types from hooks and database

export type { FocusWithParsedData } from '../hooks/useFocusData';
export type { WinWithParsedData } from '../hooks/useWinsData';
export type { QuizQuestionWithId as QuizQuestion } from '../hooks/useQuizQuestions';
export type { Pulse, ActivitySummary } from '~/db';
export type { ChatMessage } from '../lib/chat-db';

export interface StatsData {
  primeActivity: {
    name: string;
    totalTime: number;
    percentage: number;
  } | null;
  dailyTotal: number;
  weeklyTotal: number;
  topActivities: Array<{
    name: string;
    time: number;
  }>;
}

export type FocusState = 'no-focus' | 'active-focus' | 'wind-down';
