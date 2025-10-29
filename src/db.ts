import { Dexie, type Table } from "dexie"

import type { UserActivity } from "~utils"

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

export type Chat = {
  id: string
  title?: string
  userActivity: UserActivity[]
  timestamp: number
}

export type ChatMessage = {
  id?: number
  chatId: string
  by: "user" | "bot"
  type: "text" | "image" | "audio"
  content: string
}

export type ProcessedIntent = {
  id?: number
  intentId: number
  intentType: string
  originalText: string
  result: string
  timestamp: number
}

class NeuropilotDB extends Dexie {
  focus!: Table<Focus>
  pulse!: Table<Pulse>
  activitySummary!: Table<ActivitySummary>
  quizQuestions!: Table<QuizQuestion>
  chat!: Table<Chat>
  chatMessages!: Table<ChatMessage>
  pastWins!: Table<PastWin>
  pomodoro!: Table<PomodoroState>
  processedIntents!: Table<ProcessedIntent>

  constructor() {
    super("Neuropilot")
    this.version(1).stores({
      // User Activity
      websiteVisits: "&url, opened_at",
      textAttention: "++id, url, timestamp",
      imageAttention: "++id, url, timestamp",
      youtubeAttention: "&id, timestamp",
      audioAttention: "++id, url, timestamp",

      // Inference Results
      focus: "++id, last_updated",
      pulse: "++id, timestamp",
      activitySummary: "++id, timestamp",
      quizQuestions: "++id, timestamp",

      chat: "&id, timestamp",
      chatMessages: "++id, chatId",
      pastWins: "++id, time_spent",
      pomodoro: "&id, lastUpdated",
      intentQueue: "++id, timestamp"
    })

    // Version 2: Add processed intents table
    this.version(2).stores({
      processedIntents: "++id, intentId, timestamp",
      websiteVisits: "&url, opened_at"
    })
  }
}

const db = new NeuropilotDB()

export default db
