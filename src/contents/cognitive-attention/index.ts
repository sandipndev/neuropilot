import { Storage } from "@plasmohq/storage"

import {
  COGNITIVE_ATTENTION_DEBUG_MODE,
  COGNITIVE_ATTENTION_IDLE_THRESHOLD_TIME,
  COGNITIVE_ATTENTION_SHOW_OVERLAY,
  COGNITIVE_ATTENTION_SUSTAINED_TIME,
  COGNITIVE_ATTENTION_WORDS_PER_MINUTE
} from "~default-settings"

import CognitiveAttentionTracker from "./monitor"

const storage = new Storage()
let tracker: CognitiveAttentionTracker | null = null

// Helper to safely parse numbers and fallback to defaults
const parseNumber = (val: any, fallback: number) => {
  const num = Number(val)
  return Number.isFinite(num) ? num : fallback
}

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

  const onSustainedAttentionChange = (e) => console.log(e)

  tracker = new CognitiveAttentionTracker({
    debugMode,
    showOverlay,
    cognitiveAttentionThreshold,
    idleThreshold,
    wordsPerMinute,
    onSustainedAttentionChange
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

export default tracker
