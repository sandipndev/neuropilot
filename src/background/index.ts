import PQueue from "p-queue"

import { Storage } from "@plasmohq/storage"

import focusInactivityTask from "~background/focus-inactivity"
import garbageCollectionTask from "~background/garbage-collection"
import activitySummaryInferenceTask from "~background/inference/activity-summary"
import doomscrollingDetectionTask from "~background/inference/doomscrolling"
import focusInferenceTask from "~background/inference/focus"
import pulseInferenceTask from "~background/inference/pulse"
import quizQuestionsInferenceTask from "~background/inference/quiz-questions"
import websiteSummarizerTask from "~background/inference/website-summarizer"

const TASK_CONCURRENCY = 1
const queue = new PQueue({ concurrency: TASK_CONCURRENCY })
queue.pause()

const backgroundInferenceTasks = [
  activitySummaryInferenceTask,
  doomscrollingDetectionTask,
  focusInferenceTask,
  focusInactivityTask,
  websiteSummarizerTask
]

type QueuedTask = {
  name: string
  enqueuedAt: number
  id: string
}
const taskMetadata: QueuedTask[] = []

let taskIdCounter = 0

const enqueueTask = (taskFn: () => Promise<any>) => {
  const meta: QueuedTask = {
    name: taskFn.name,
    enqueuedAt: Date.now(),
    id: `${taskFn.name}-${Date.now()}-${++taskIdCounter}`
  }
  taskMetadata.push(meta)

  queue.add(async () => {
    try {
      await taskFn()
    } catch (err) {
      console.error("Task failed:", err)
    } finally {
      const idx = taskMetadata.indexOf(meta)
      if (idx !== -1) taskMetadata.splice(idx, 1)

      queue.emit("next")
    }
  })
}

const runContinuousTasksLoop = async () => {
  while (true) {
    for (const task of backgroundInferenceTasks) enqueueTask(task)

    await queue.onIdle()

    await new Promise((r) => setTimeout(r, 1000))
  }
}

const startScheduler = async () => {
  if (await storage.get("onboarded")) {
    queue.start()
  }
  runContinuousTasksLoop()
}

const storage = new Storage()
storage.watch({
  onboarded: startScheduler
})

const init = async () => {
  await startScheduler()
}
init().catch(console.error)

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "pulse-task":
      if (!taskMetadata.find((t) => t.name === "pulseInferenceTask"))
        enqueueTask(pulseInferenceTask)
      break
    case "quiz-task":
      if (!taskMetadata.find((t) => t.name === "quizQuestionsInferenceTask"))
        enqueueTask(quizQuestionsInferenceTask)
      break
    case "garbage-collection-task":
      if (!taskMetadata.find((t) => t.name === "garbageCollectionTask"))
        enqueueTask(garbageCollectionTask)
      break
  }
})

chrome.runtime.onInstalled.addListener(() => {
  // cron
  chrome.alarms.create("pulse-task", { periodInMinutes: 5 })
  chrome.alarms.create("quiz-task", { periodInMinutes: 2 })
  chrome.alarms.create("garbage-collection-task", { periodInMinutes: 60 * 24 })

  // context menus
  const menus = [
    {
      id: "add-image-to-chat",
      title: "Add this image to chat",
      contexts: ["image"]
    },
    {
      id: "add-selection-to-chat",
      title: "Add selected text to chat",
      contexts: ["selection"]
    },
    {
      id: "analyze-selection",
      title: "Analyze selected text",
      contexts: ["selection"]
    },
    {
      id: "summarize-page",
      title: "Summarize this page",
      contexts: ["page"]
    },
    {
      id: "chat-with-this-page",
      title: "Chat with this page",
      contexts: ["page"]
    }
  ]

  menus.forEach((m) =>
    chrome.contextMenus.create(m as chrome.contextMenus.CreateProperties)
  )
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const message = { source: "contextMenu", tabId: tab?.id }
  chrome.sidePanel.open({ tabId: tab?.id })

  switch (info.menuItemId) {
    case "add-image-to-chat":
      if (info.srcUrl)
        chrome.runtime.sendMessage({
          ...message,
          type: "ADD_IMAGE_TO_CHAT",
          payload: info.srcUrl
        })
      break

    case "add-selection-to-chat":
      if (info.selectionText)
        chrome.runtime.sendMessage({
          ...message,
          type: "ADD_SELECTION_TO_CHAT",
          payload: info.selectionText
        })
      break

    case "analyze-selection":
      if (info.selectionText)
        chrome.runtime.sendMessage({
          ...message,
          type: "ANALYZE_SELECTION",
          payload: info.selectionText
        })
      break

    case "summarize-page":
      chrome.runtime.sendMessage({
        ...message,
        type: "SUMMARIZE_PAGE"
      })
      break

    case "chat-with-this-page":
      chrome.runtime.sendMessage({
        ...message,
        type: "CHAT_WITH_THIS_PAGE"
      })
      break
  }
})

// side panel open on icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

export { queue, taskMetadata }
