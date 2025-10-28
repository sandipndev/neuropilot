import db, { type ActivitySummary } from "~db"
import { getSummarizer } from "~model"
import { allUserActivityForLastMs, attentionContent } from "~utils"

const activitySummaryInferenceTask = async () => {
  const ONE_MINUTE_MS = 1 * 60 * 1000
  const recentActivity = await allUserActivityForLastMs(ONE_MINUTE_MS)

  if (recentActivity.length === 0) {
    return
  }

  const data = attentionContent(recentActivity)

  const PROMPT = `
  This is the user's activity data from the last minute. I need a 5-6 word third-person summary describing what the user is doing.
  Based on the following user activity data from the last minute, generate a 5-6 word third-person summary describing what the user is doing.

  Examples of good summaries:
  - "You are reading about Hermione"
  - "You are learning React hooks"
  - "You are watching cooking tutorials"
  - "You are browsing tech news"
  - "You are researching climate change"

  Requirements:
  - EXACTLY 5-6 words
  - Third person perspective starting with "You are" or "You're"
  - Specific and descriptive based on ACTUAL data above
  - No generic phrases
  - Casual, natural tone

  I need ONLY the summary text, nothing else.`

  const summarizer = await getSummarizer("tldr")
  const summary = await summarizer.summarize(data, {
    context: PROMPT.trim()
  })
  summarizer.destroy()

  const previousSummary = await db
    .table<ActivitySummary>("activitySummary")
    .orderBy("timestamp")
    .last()

  if (previousSummary.summary == summary) {
    return
  }

  await db.table<ActivitySummary>("activitySummary").add({
    summary,
    timestamp: Date.now()
  })
}

export default activitySummaryInferenceTask
