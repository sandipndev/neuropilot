import { Storage } from "@plasmohq/storage"

import {
  DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD,
  DOOMSCROLLING_TIME_WINDOW,
  NotificationMessageType
} from "~default-settings"
import { allUserActivityForLastMs, sendNotification } from "~utils"

const storage = new Storage()
const LAST_DOOMSCROLL_NOTIFICATION_KEY =
  "last-doomscroll-notification-timestamp"

const doomscrollingDetectionTask = async () => {
  const timeWindowValue = await storage.get(DOOMSCROLLING_TIME_WINDOW.key)
  const timeWindow = Number(
    timeWindowValue || DOOMSCROLLING_TIME_WINDOW.defaultValue
  )

  const itemsThresholdValue = await storage.get(
    DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.key
  )
  const itemsThreshold = Number(
    itemsThresholdValue || DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD.defaultValue
  )

  const recentActivity = await allUserActivityForLastMs(timeWindow)

  const totalAttentionItems = recentActivity.reduce((total, activity) => {
    return (
      total + activity.textAttentions.length + activity.imageAttentions.length
    )
  }, 0)

  if (totalAttentionItems < itemsThreshold) {
    await sendNotification(
      NotificationMessageType.DOOMSCROLLING_DETECTED,
      LAST_DOOMSCROLL_NOTIFICATION_KEY
    )
  }
}

export default doomscrollingDetectionTask
