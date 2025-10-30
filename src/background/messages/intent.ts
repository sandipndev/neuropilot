import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import db from "~db"
import { INTENT_QUEUE_NOTIFY } from "~default-settings"

const storage = new Storage()

type IntentItems = [
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
]

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

type BaseIntent = {
  name: IntentName
  timestamp: number
  processed?: boolean
}

export type Intent =
  | (BaseIntent & {
    type: "PROOFREAD"
    text: string
  })
  | (BaseIntent & {
    type: "TRANSLATE"
    text: string
    language: keyof typeof CODE_TO_LANGUAGE
  })
  | (BaseIntent & {
    type: "REPHRASE"
    text: string
  })
  | (BaseIntent & {
    type: "SUMMARIZE"
    text: string
  })
  | (BaseIntent & {
    type: "CHAT"
    payload: string
    payloadType: "IMAGE" | "TEXT" | "AUDIO"
  })

export type IntentName = IntentItems[number]
export type IntentType = Intent["type"]

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
