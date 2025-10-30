import { Storage } from "@plasmohq/storage"

import type { WebsiteVisit } from "~background/messages/website-visit"
import db from "~db"
import {
  DOOMSCROLLING_TIME_WINDOW,
  NotificationMessageType
} from "~default-settings"
import { sendNotification } from "~utils"

const storage = new Storage()
const LAST_DOOMSCROLL_NOTIFICATION_KEY =
  "last-doomscroll-notification-timestamp"

const doomscrollingDetectionTask = async () => {
  const timeWindowValue = await storage.get(DOOMSCROLLING_TIME_WINDOW.key)
  const timeWindow = Number(
    timeWindowValue || DOOMSCROLLING_TIME_WINDOW.defaultValue
  )

  // Get the most recent updated_at timestamp from websiteVisits
  const allVisits = await db.table<WebsiteVisit>("websiteVisits").toArray()

  if (allVisits.length === 0) {
    return
  }

  const maxUpdatedAt = Math.max(...allVisits.map(visit => visit.updated_at))
  const timeSinceLastActivity = Date.now() - maxUpdatedAt

  console.debug("doomscrollingDetectionTask", {
    maxUpdatedAt,
    timeSinceLastActivity,
    timeWindow,
    isDoomscrolling: timeSinceLastActivity >= timeWindow
  })

  // If user hasn't been active for the threshold time, they're doomscrolling
  if (timeSinceLastActivity >= timeWindow) {
    await sendNotification(
      NotificationMessageType.DOOMSCROLLING_DETECTED,
      LAST_DOOMSCROLL_NOTIFICATION_KEY
    )
  }
}

export default doomscrollingDetectionTask
