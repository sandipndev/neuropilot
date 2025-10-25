// Shared TypeScript interfaces for Pinnacle Dashboard

export interface FocusWithParsedData {
  id: string;
  focus_item: string;
  keywords: string[];
  time_spent: Array<{
    start: number;
    stop: number | null;
  }>;
  last_updated: number;
  total_time: number; // in milliseconds
}

export interface WinWithParsedData {
  id: string;
  focus_item: string;
  time_spent: number; // in milliseconds
  recorded_at: number;
  keywords: string[];
  time_spent_hours: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  option_1: string;
  option_2: string;
  correct_answer: 1 | 2;
  timestamp: number;
}

export interface Pulse {
  id: string;
  message: string;
  timestamp: number;
}

export interface ActivitySummary {
  id: string;
  summary: string;
  timestamp: number;
  focus_item: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

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
