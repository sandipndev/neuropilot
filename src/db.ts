import { Dexie } from "dexie"

const db = new Dexie("Neuropilot")

db.version(1).stores({
  // User Activity
  websiteVisits: "&url, opened_at",
  textAttention: "++id, url, timestamp",
  imageAttention: "++id, url, timestamp",

  // Inference Results
  focus: "++id, last_updated",
  pulse: "++id, timestamp",
  activitySummary: "++id, timestamp",
  quizQuestions: "++id, timestamp",

  chatMessages: "++id, timestamp",
  pastWins: "++id, time_spent",
  pomodoro: "&id, lastUpdated"
})

export default db;


export type Focus = {
  id?: number
  item: string
  keywords: string[]
  time_spent: {
    start: number
    end: number | null
  }[]
  last_updated: number
}


export type Pulse = {
  message: string
  timestamp: number
}

export type QuizQuestion = {
  question: string
  option_1: string
  option_2: string
  correct_answer: number
  timestamp: number
}

export type ActivitySummary = {
  summary: string
  timestamp: number
}

export type PastWin = {
  id?: number
  focus_item: string
  time_spent: number
  time_spent_hours: number
  recorded_at: number
}

export type PomodoroStateType = "idle" | "focus" | "break"

export type PomodoroState = {
  id: string
  isActive: boolean
  remainingTime: number // seconds
  state: PomodoroStateType
  startTime: number | null // timestamp when timer started
  totalPomodoros: number
  lastUpdated: number
}

export type ChatMessage = {
  id?: number
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

