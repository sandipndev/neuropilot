import { Storage } from "@plasmohq/storage"

import db, { type Focus } from "~db"
import { FOCUS_INACTIVITY_THRESHOLD } from "~default-settings"
import { allUserActivityForLastMs, getActiveFocus } from "~utils"

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
  }
}

export default focusInactivityTask
