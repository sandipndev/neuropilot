import PQueue from "p-queue"

import focusInferenceTask from "./focus"
import pulseInferenceTask from "./pulse"
import websiteSummarizerTask from "./website-summarizer"

const TASK_CONCURRENCY = 1

const queue = new PQueue({ concurrency: TASK_CONCURRENCY })

const scheduleBackgroundInferenceTasks = () => {
  queue.add(async () => websiteSummarizerTask())
  queue.add(async () => focusInferenceTask())
  queue.add(async () => pulseInferenceTask())
}

queue.add(() => scheduleBackgroundInferenceTasks())
queue.on("idle", async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  scheduleBackgroundInferenceTasks()
})

export default queue
