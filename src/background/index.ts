import PQueue from "p-queue"

import { backgroundInferenceTasks } from "./inference"

const TASK_CONCURRENCY = 1

const queue = new PQueue({ concurrency: TASK_CONCURRENCY })

const scheduleBackgroundInferenceTasks = async () => {
  for (const task of backgroundInferenceTasks) {
    console.log("scheduling task", task.name)
    queue.add(async () => task())
  }
}

queue.add(() => scheduleBackgroundInferenceTasks())
queue.on("idle", async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  scheduleBackgroundInferenceTasks()
})

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})
