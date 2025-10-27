import db, { type Focus, type PastWin } from "~db"

const updatePastWinsTask = async () => {
  const now = Date.now()

  const allFocusItems = await db.table<Focus>("focus").toArray()

  const focusTimeMap = new Map<string, number>()

  for (const focus of allFocusItems) {
    let totalTime = 0
    for (const timeSpent of focus.time_spent) {
      const start = timeSpent.start
      const end = timeSpent.end || now
      totalTime += end - start
    }

    const focusItem = focus.item
    const existingTime = focusTimeMap.get(focusItem) || 0
    focusTimeMap.set(focusItem, existingTime + totalTime)
  }

  const existingPastWins = await db.table<PastWin>("pastWins").toArray()

  for (const pastWin of existingPastWins) {
    const existingTime = focusTimeMap.get(pastWin.focus_item) || 0
    focusTimeMap.set(pastWin.focus_item, existingTime + pastWin.time_spent)
  }

  const sortedFocusItems = Array.from(focusTimeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  await db.table("pastWins").clear()

  for (const [focusItem, timeSpent] of sortedFocusItems) {
    await db.table<PastWin>("pastWins").add({
      focus_item: focusItem,
      time_spent: timeSpent,
      time_spent_hours: timeSpent / (1000 * 60 * 60),
      recorded_at: now
    })
  }
}

export default updatePastWinsTask
