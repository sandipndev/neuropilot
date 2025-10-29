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
  if (taskMetadata.find((t) => t.name === taskFn.name)) return

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

// const runContinuousTasksLoop = async () => {
//   while (true) {
//     for (const task of backgroundInferenceTasks) enqueueTask(task)

//     await queue.onIdle()

//     await new Promise((r) => setTimeout(r, 1000))
//   }
// }

const startScheduler = async () => {
  if (await storage.get("onboarded")) {
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
      enqueueTask(pulseInferenceTask)
      break
    case "quiz-task":
      enqueueTask(quizQuestionsInferenceTask)
      break
    case "garbage-collection-task":
      enqueueTask(garbageCollectionTask)
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

// side panel open on icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

export { queue, taskMetadata }
