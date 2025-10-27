import { Storage } from "@plasmohq/storage"

import db from "~db"
import { GARBAGE_COLLECTION_INTERVAL } from "~default-settings"

const storage = new Storage()

const LAST_RUN_KEY = "garbage-collection-last-run"

const garbageCollectionTask = async () => {
  const lastRun = await storage.get(LAST_RUN_KEY)
  const now = Date.now()

  const intervalValue =
    (await storage.get(GARBAGE_COLLECTION_INTERVAL.key)) ||
    GARBAGE_COLLECTION_INTERVAL.defaultValue
  const interval =
    typeof intervalValue === "string" ? parseInt(intervalValue) : intervalValue

  if (lastRun && now - parseInt(lastRun) < interval) {
    return
  }

  const cutoffTime = now - interval

  await db.table("websiteVisits").where("opened_at").below(cutoffTime).delete()

  await db.table("textAttention").where("timestamp").below(cutoffTime).delete()

  await db.table("imageAttention").where("timestamp").below(cutoffTime).delete()

  await db.table("focus").where("last_updated").below(cutoffTime).delete()

  await db.table("pulse").where("timestamp").below(cutoffTime).delete()

  await db
    .table("activitySummary")
    .where("timestamp")
    .below(cutoffTime)
    .delete()

  await db.table("quizQuestions").where("timestamp").below(cutoffTime).delete()

  await db.table("chatMessages").where("timestamp").below(cutoffTime).delete()

  await storage.set(LAST_RUN_KEY, now.toString())
}

export default garbageCollectionTask
