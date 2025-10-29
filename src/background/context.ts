import { Storage } from "@plasmohq/storage"

import db from "~db"
import { INTENT_QUEUE_NOTIFY } from "~default-settings"

import { type Intent, type IntentName } from "./messages/intent"

const CONTEXT_MENUS = {
  selection: [
    {
      id: "add-selection-to-chat",
      title: "💬 Add to Chat",
      contexts: ["selection"] as chrome.contextMenus.ContextType[]
    },
    { type: "separator" as const },
    {
      id: "proofread-selection",
      title: "✓ Proofread",
      contexts: ["selection"] as chrome.contextMenus.ContextType[]
    },
    {
      id: "rephrase-selection",
      title: "✏️ Rephrase",
      contexts: ["selection"] as chrome.contextMenus.ContextType[]
    },
    {
      id: "summarize-selection",
      title: "📝 Summarize",
      contexts: ["selection"] as chrome.contextMenus.ContextType[]
    },
    { type: "separator" as const },
    {
      id: "analyze-selection",
      title: "🔍 Analyze",
      contexts: ["selection"] as chrome.contextMenus.ContextType[]
    }
  ],

  image: [
    {
      id: "add-image-to-chat",
      title: "💬 Add this image to chat",
      contexts: ["image"] as chrome.contextMenus.ContextType[]
    }
  ],

  page: [
    {
      id: "chat-with-this-page",
      title: "💬 Chat with this page",
      contexts: ["page"] as chrome.contextMenus.ContextType[]
    },
    {
      id: "summarize-page",
      title: "📝 Summarize this page",
      contexts: ["page"] as chrome.contextMenus.ContextType[]
    },
    {
      id: "key-points-page",
      title: "🎯 Extract key points",
      contexts: ["page"] as chrome.contextMenus.ContextType[]
    }
  ],

  link: [
    {
      id: "summarize-link",
      title: "📝 Summarize linked page",
      contexts: ["link"] as chrome.contextMenus.ContextType[]
    }
  ]
}

chrome.runtime.onInstalled.addListener(() => {
  Object.values(CONTEXT_MENUS)
    .flat()
    .forEach((menu) => {
      if ("type" in menu && menu.type === "separator") {
        chrome.contextMenus.create({
          type: "separator",
          contexts: ["selection"]
        })
      } else {
        chrome.contextMenus.create(menu as chrome.contextMenus.CreateProperties)
      }
    })

  // Allow fetching images from other domains
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1], // Remove if exists
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
          responseHeaders: [
            {
              header: "access-control-allow-origin",
              operation:
                "set" as chrome.declarativeNetRequest.HeaderOperation.SET,
              value: "*"
            }
          ]
        },
        condition: {
          urlFilter: "*",
          resourceTypes: [
            "xmlhttprequest" as chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST
          ]
        }
      }
    ]
  })
})

const storage = new Storage()

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  await chrome.sidePanel.open({ tabId: tab?.id })

  switch (info.menuItemId as IntentName) {
    case "add-image-to-chat": {
      if (info.srcUrl) {
        const response = await fetch(info.srcUrl)
        const blob = await response.blob()

        const base64 = await new Promise<string>((r) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            r(reader.result as string)
          }
          reader.readAsDataURL(blob)
        })

        await db.table<Intent>("intentQueue").add({
          name: "add-image-to-chat",
          type: "CHAT",
          payload: base64,
          payloadType: "IMAGE",
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "chat-with-this-page": {
      if (tab?.url) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () =>
            document.querySelector("main")
              ? document.querySelector("main")?.innerText
              : document.body.innerText
        })
        const pageText = results[0]?.result || ""

        await db.table<Intent>("intentQueue").add({
          name: "chat-with-this-page",
          type: "CHAT",
          payload: JSON.stringify({ url: tab.url, text: pageText }),
          payloadType: "TEXT",
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "add-selection-to-chat": {
      if (info.selectionText) {
        await db.table<Intent>("intentQueue").add({
          name: "add-selection-to-chat",
          type: "CHAT",
          payload: info.selectionText,
          payloadType: "TEXT",
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "proofread-selection": {
      if (info.selectionText) {
        await db.table<Intent>("intentQueue").add({
          name: "proofread-selection",
          type: "PROOFREAD",
          text: info.selectionText,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "rephrase-selection": {
      if (info.selectionText) {
        await db.table<Intent>("intentQueue").add({
          name: "rephrase-selection",
          type: "REPHRASE",
          text: info.selectionText,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "summarize-selection": {
      if (info.selectionText) {
        await db.table<Intent>("intentQueue").add({
          name: "summarize-selection",
          type: "SUMMARIZE",
          text: info.selectionText,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "analyze-selection": {
      if (info.selectionText) {
        await db.table<Intent>("intentQueue").add({
          name: "analyze-selection",
          type: "CHAT",
          payload: info.selectionText,
          payloadType: "TEXT",
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "key-points-page": {
      if (tab?.url) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () =>
            document.querySelector("main")
              ? document.querySelector("main")?.innerText
              : document.body.innerText
        })
        const pageText = results[0]?.result || ""

        await db.table<Intent>("intentQueue").add({
          name: "key-points-page",
          type: "SUMMARIZE",
          text: pageText,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "summarize-link": {
      if (info.linkUrl) {
        const response = await fetch(info.linkUrl)
        const text = await response.text()

        await db.table<Intent>("intentQueue").add({
          name: "summarize-link",
          type: "SUMMARIZE",
          text: text,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
    case "summarize-page": {
      if (tab?.url) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () =>
            document.querySelector("main")
              ? document.querySelector("main")?.innerText
              : document.body.innerText
        })
        const pageText = results[0]?.result || ""

        await db.table<Intent>("intentQueue").add({
          name: "summarize-page",
          type: "SUMMARIZE",
          text: pageText,
          timestamp: Date.now(),
          processed: false
        })
      }
      break
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1200))
  await storage.set(INTENT_QUEUE_NOTIFY, Date.now())
})
