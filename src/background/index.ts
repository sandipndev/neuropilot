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

import "~background/context"
import { ONBOARDED_KEY } from "~tabs/welcome/api/user-data"

const TASK_CONCURRENCY = 1
const queue = new PQueue({ concurrency: TASK_CONCURRENCY })
queue.pause()

type TaskDefinition = {
  name: string
  fn: () => Promise<void>
}

const backgroundInferenceTasks: TaskDefinition[] = [
  { name: "activity-summary", fn: activitySummaryInferenceTask },
  { name: "doomscrolling-detection", fn: doomscrollingDetectionTask },
  { name: "focus-inference", fn: focusInferenceTask },
  { name: "focus-inactivity", fn: focusInactivityTask },
  { name: "website-summarizer", fn: websiteSummarizerTask }
]

const pulseTask: TaskDefinition = {
  name: "pulse-inference",
  fn: pulseInferenceTask
}

const quizTask: TaskDefinition = {
  name: "quiz-questions",
  fn: quizQuestionsInferenceTask
}

const garbageCollectionTaskDef: TaskDefinition = {
  name: "garbage-collection",
  fn: garbageCollectionTask
}

type QueuedTask = {
  name: string
  enqueuedAt: number
  id: string
}
const taskMetadata: QueuedTask[] = []

let taskIdCounter = 0

const enqueueTask = (task: TaskDefinition) => {
  if (taskMetadata.find((t) => t.name === task.name)) return

  const meta: QueuedTask = {
    name: task.name,
    enqueuedAt: Date.now(),
    id: `${task.name}-${Date.now()}-${++taskIdCounter}`
  }
  taskMetadata.push(meta)

  queue.add(async () => {
    try {
      await task.fn()
    } catch (err) {
      console.error("Task failed:", err)
    } finally {
      const idx = taskMetadata.indexOf(meta)
      if (idx !== -1) taskMetadata.splice(idx, 1)

      queue.emit("next")
    }
  })
}

// const runContinuousTasksLoop = async () => {
//   while (true) {
//     for (const task of backgroundInferenceTasks) enqueueTask(task)

//     await queue.onIdle()

//     await new Promise((r) => setTimeout(r, 1000))
//   }
// }

const startScheduler = async () => {
  if (await storage.get(ONBOARDED_KEY)) {
    queue.start()
  }
  // runContinuousTasksLoop()
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
      enqueueTask(pulseTask)
      break
    case "quiz-task":
      enqueueTask(quizTask)
      break
    case "garbage-collection-task":
      enqueueTask(garbageCollectionTaskDef)
      break
    case "continuous-tasks-loop":
      for (const task of backgroundInferenceTasks) enqueueTask(task)
      break
  }
})

chrome.runtime.onInstalled.addListener((details) => {
  // cron
  chrome.alarms.create("pulse-task", { periodInMinutes: 5 })
  chrome.alarms.create("quiz-task", { periodInMinutes: 2 })
  chrome.alarms.create("garbage-collection-task", { periodInMinutes: 60 * 24 })

  chrome.alarms.create("continuous-tasks-loop", { periodInMinutes: 0.5 })

  // open welcome page on first install
  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/welcome.html") })
  }
})

// Testing Stuff ...
// Helper function to notify content script about sidepanel opening
const notifySidepanelOpened = async (tabId: number) => {
  try {
    // console.log("[Neuropilot] Sending SIDEPANEL_OPENED message to tab:", tabId)
    await chrome.tabs.sendMessage(tabId, { type: "SIDEPANEL_OPENED" })
    // console.log("[Neuropilot] Message sent successfully")
  } catch (err) {
    console.debug("Could not notify content script:", err)
  }
}

// side panel open on icon click
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId })
  if (tab.id) {
    await notifySidepanelOpened(tab.id)
  }
})

export { queue, taskMetadata }
