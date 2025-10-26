import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import {
  COGNITIVE_ATTENTION_DEBUG_MODE,
  COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME,
  COGNITIVE_ATTENTION_SHOW_OVERLAY,
  COGNITIVE_ATTENTION_SUSTAINED_TIME,
  COGNITIVE_ATTENTION_WORDS_PER_MINUTE
} from "~default-settings"

import CognitiveAttentionTracker from "./monitor"

const COGNITIVE_ATTENTION_TEXT_MESSAGE_NAME = "cognitive-attention-text"

const storage = new Storage()
let tracker: CognitiveAttentionTracker | null = null

const URL = location.href

// Helper to safely parse numbers and fallback to defaults
const parseNumber = (val: any, fallback: number) => {
  const num = Number(val)
  return Number.isFinite(num) ? num : fallback
}

const readingProgressTracker = new Map<number, number>()

const initTracker = async () => {
  const cognitiveAttentionThreshold = parseNumber(
    await storage.get(COGNITIVE_ATTENTION_SUSTAINED_TIME.key),
    COGNITIVE_ATTENTION_SUSTAINED_TIME.defaultValue
  )

  const idleThreshold = parseNumber(
    await storage.get(COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.key),
    COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.defaultValue
  )

  const wordsPerMinute = parseNumber(
    await storage.get(COGNITIVE_ATTENTION_WORDS_PER_MINUTE.key),
    COGNITIVE_ATTENTION_WORDS_PER_MINUTE.defaultValue
  )

  const debugMode =
    String(await storage.get(COGNITIVE_ATTENTION_DEBUG_MODE.key)) === "true" ||
    COGNITIVE_ATTENTION_DEBUG_MODE.defaultValue

  const showOverlay =
    String(await storage.get(COGNITIVE_ATTENTION_SHOW_OVERLAY.key)) ===
      "true" || COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue

  if (tracker) {
    tracker.destroy?.()
  }

  tracker = new CognitiveAttentionTracker({
    debugMode,
    showOverlay,
    cognitiveAttentionThreshold,
    idleThreshold,
    wordsPerMinute,
    onSustainedAttentionChange: async (data) => {
      const { text, wordsRead } = data
      if (!text || wordsRead <= 0) return

      const textHash = hashString(text)
      const prev = readingProgressTracker.get(textHash) || 0
      const deltaWords = wordsRead - prev
      if (deltaWords <= 0) return

      const deltaText = extractWords(text, wordsRead)
        .slice(extractWords(text, prev).length)
        .trim()

      if (!deltaText) return

      readingProgressTracker.set(textHash, wordsRead)
      await sendToBackground({
        name: COGNITIVE_ATTENTION_TEXT_MESSAGE_NAME,
        body: {
          url: URL,
          text: deltaText,
          wordsRead: deltaWords,
          timestamp: Date.now()
        }
      })
    }
  })

  tracker.init()
}

initTracker().then(() => {
  // Recreate tracker whenever relevant settings change
  storage.watch({
    [COGNITIVE_ATTENTION_SUSTAINED_TIME.key]: initTracker,
    [COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME.key]: initTracker,
    [COGNITIVE_ATTENTION_WORDS_PER_MINUTE.key]: initTracker,
    [COGNITIVE_ATTENTION_DEBUG_MODE.key]: initTracker,
    [COGNITIVE_ATTENTION_SHOW_OVERLAY.key]: initTracker
  })
})

const extractWords = (text: string, wordCount: number): string => {
  const words = text.split(/\s+/)
  return words.slice(0, wordCount).join(" ")
}

const hashString = (s: string) =>
  [...s].reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0) >>> 0

export default tracker
