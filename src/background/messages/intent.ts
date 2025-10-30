import { z } from "zod"

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import db from "~db"
import { INTENT_QUEUE_NOTIFY } from "~default-settings"

const storage = new Storage()

const INTENT_ITEMS = [
  "add-selection-to-chat",
  "proofread-selection",
  "rephrase-selection",
  "summarize-selection",
  "analyze-selection",
  "add-image-to-chat",
  "chat-with-this-page",
  "summarize-page",
  "key-points-page",
  "summarize-link",
  "proofread",
  "translate",
  "rephrase",
  "summarize",
  "chat"
] as const

export const CODE_TO_LANGUAGE = {
  en: "English",
  es: "Spanish",
  hi: "Hindi",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  bn: "Bengali",
  id: "Indonesian",
  tr: "Turkish",
  vi: "Vietnamese",
  th: "Thai",
  nl: "Dutch",
  pl: "Polish"
}

const IntentSchema = z.discriminatedUnion("type", [
  z.object({
    name: z.enum(INTENT_ITEMS),
    type: z.literal("PROOFREAD"),
    text: z.string(),
    timestamp: z.number(),
    processed: z.boolean().optional().default(false)
  }),
  z.object({
    name: z.enum(INTENT_ITEMS),
    type: z.literal("TRANSLATE"),
    text: z.string(),
    language: z.enum(Object.keys(CODE_TO_LANGUAGE)),
    timestamp: z.number(),
    processed: z.boolean().optional().default(false)
  }),
  z.object({
    name: z.enum(INTENT_ITEMS),
    type: z.literal("REPHRASE"),
    text: z.string(),
    timestamp: z.number(),
    processed: z.boolean().optional().default(false)
  }),
  z.object({
    name: z.enum(INTENT_ITEMS),
    type: z.literal("SUMMARIZE"),
    text: z.string(),
    timestamp: z.number(),
    processed: z.boolean().optional().default(false)
  }),
  z.object({
    name: z.enum(INTENT_ITEMS),
    type: z.literal("CHAT"),
    payload: z.string(),
    payloadType: z.enum(["IMAGE", "TEXT", "AUDIO"]),
    timestamp: z.number(),
    processed: z.boolean().optional().default(false)
  })
])

export type Intent = z.infer<typeof IntentSchema>
export type IntentName = (typeof INTENT_ITEMS)[number]

const INTENT_TYPES = IntentSchema.options.map((s) => s.shape.type.value)
export type IntentType = (typeof INTENT_TYPES)[number]

const notifySidepanelOpened = async (tabId: number) => {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "SIDEPANEL_OPENED" })
  } catch (err) {
    console.debug("Could not notify content script:", err)
  }
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  const tabId = req.sender.tab?.id
  if (!tabId) return

  await chrome.sidePanel.open({ tabId })
  await notifySidepanelOpened(tabId)

  switch (req.body.type as IntentName) {
    case "chat": {
      await db.table<Intent>("intentQueue").add({
        name: "chat",
        type: "CHAT",
        payload: req.body.text,
        payloadType: "TEXT",
        timestamp: Date.now(),
        processed: false
      })
      break
    }
    case "proofread": {
      await db.table<Intent>("intentQueue").add({
        name: "proofread",
        type: "PROOFREAD",
        text: req.body.text,
        timestamp: Date.now(),
        processed: false
      })
      break
    }
    case "rephrase": {
      await db.table<Intent>("intentQueue").add({
        name: "rephrase",
        type: "REPHRASE",
        text: req.body.text,
        timestamp: Date.now(),
        processed: false
      })
      break
    }
    case "summarize": {
      await db.table<Intent>("intentQueue").add({
        name: "summarize",
        type: "SUMMARIZE",
        text: req.body.text,
        timestamp: Date.now(),
        processed: false
      })
      break
    }
    case "translate": {
      await db.table<Intent>("intentQueue").add({
        name: "translate",
        type: "TRANSLATE",
        text: req.body.text,
        language: req.body.language,
        timestamp: Date.now(),
        processed: false
      })
      break
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1200))
  await storage.set(INTENT_QUEUE_NOTIFY, Date.now())
}

export default handler
