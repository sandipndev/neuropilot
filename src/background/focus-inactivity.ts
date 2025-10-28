import { Storage } from "@plasmohq/storage"

import db, { type Focus } from "~db"
import {
  FOCUS_INACTIVITY_THRESHOLD,
  NotificationMessageType
} from "~default-settings"
import {
  allUserActivityForLastMs,
  getActiveFocus,
  sendNotification
} from "~utils"

const LAST_FOCUS_INACTIVITY_NOTIFICATION_KEY =
  "last-focus-inactivity-notification-timestamp"

const focusInactivityTask = async () => {
  const activeFocus = await getActiveFocus()
  if (!activeFocus) {
    return
  }

  const storage = new Storage()
  const thresholdMs = Number(
    ((await storage.get(FOCUS_INACTIVITY_THRESHOLD.key)) as string) ||
      FOCUS_INACTIVITY_THRESHOLD.defaultValue
  )

  const recentActivity = await allUserActivityForLastMs(thresholdMs)

  // If no activity within the threshold, stop the active focus
  if (recentActivity.length === 0) {
    const now = Date.now()
    await db
      .table<Focus>("focus")
      .where("id")
      .equals(activeFocus.id)
      .modify((focus) => {
        focus.time_spent[focus.time_spent.length - 1].end = now
        focus.last_updated = now
      })

    await sendNotification(
      NotificationMessageType.FOCUS_INACTIVITY_DETECTED,
      LAST_FOCUS_INACTIVITY_NOTIFICATION_KEY
    )
  }
}

export default focusInactivityTask
