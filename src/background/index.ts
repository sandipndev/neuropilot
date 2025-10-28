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
const continuousTasksQueue = new PQueue({ concurrency: TASK_CONCURRENCY })
const cronTasksQueue = new PQueue({ concurrency: TASK_CONCURRENCY })

continuousTasksQueue.pause()
cronTasksQueue.pause()

// to run frequently
const backgroundInferenceTasks = [
  activitySummaryInferenceTask,
  doomscrollingDetectionTask,
  focusInferenceTask,
  focusInactivityTask,
  websiteSummarizerTask
]

const enqueueTask = (taskFn: () => Promise<any>, queue: PQueue) => {
  console.log("Enqueuing task:", taskFn.name)
  queue.add(async () => {
    try {
      await taskFn()
    } catch (err) {
      console.error("Task failed:", err)
    }
  })
}

// run inference loop continuously
const scheduleBackgroundInferenceTasks = async () => {
  for (const task of backgroundInferenceTasks)
    enqueueTask(task, continuousTasksQueue)
}

continuousTasksQueue.add(() => scheduleBackgroundInferenceTasks())
continuousTasksQueue.on("idle", async () => {
  // wait a second to avoid issues and again continue
  await new Promise((r) => setTimeout(r, 1000))
  scheduleBackgroundInferenceTasks()
})

// alarms for background tasks
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("pulse-task", { periodInMinutes: 5 })
  chrome.alarms.create("quiz-task", { periodInMinutes: 2 })
  chrome.alarms.create("garbage-collection-task", { periodInMinutes: 60 * 24 })
})
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "pulse-task":
      enqueueTask(pulseInferenceTask, cronTasksQueue)
      break
    case "quiz-task":
      enqueueTask(quizQuestionsInferenceTask, cronTasksQueue)
      break
    case "garbage-collection-task":
      enqueueTask(garbageCollectionTask, cronTasksQueue)
      break
  }
})

const startScheduler = () => {
  continuousTasksQueue.start()
  cronTasksQueue.start()
}

const storage = new Storage()
storage.watch({
  onboarded: startScheduler
})

const init = async () => {
  // startScheduler() // comment this line to onboarding scheduler on
  if (await storage.get("onboarded")) startScheduler()
}
init().catch(console.error)

// side panel open on icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})
