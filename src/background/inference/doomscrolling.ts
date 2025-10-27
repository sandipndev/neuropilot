import { Storage } from "@plasmohq/storage"

import {
  DOOMSCROLLING_ATTENTION_ITEMS_THRESHOLD,
  DOOMSCROLLING_TIME_WINDOW,
  NOTIFICATION_STORAGE_KEY,
  NotificationMessageType
} from "~default-settings"
import { allUserActivityForLastMs } from "~utils"

const notification_type: NotificationMessageType =
  NotificationMessageType.DOOMSCROLLING_DETECTED

const storage = new Storage()
const NOTIFICATION_COOLDOWN_MS = 60000 // 1 minute
const LAST_DOOMSCROLL_NOTIFICATION_KEY =
  "last-doomscroll-notification-timestamp"

const doomscrollingDetectionTask = async () => {
  const timeWindowValue = await storage.get(DOOMSCROLLING_TIME_WINDOW.key)
  const timeWindow = Number(
    timeWindowValue ?? DOOMSCROLLING_TIME_WINDOW.defaultValue
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
    const lastNotificationTime = await storage.get(
      LAST_DOOMSCROLL_NOTIFICATION_KEY
    )
    const now = Date.now()

    if (
      !lastNotificationTime ||
      now - Number(lastNotificationTime) >= NOTIFICATION_COOLDOWN_MS
    ) {
      await storage.set(NOTIFICATION_STORAGE_KEY, {
        type: notification_type,
        timestamp: now
      })
      await storage.set(LAST_DOOMSCROLL_NOTIFICATION_KEY, now)
    }
  }
}

export default doomscrollingDetectionTask
