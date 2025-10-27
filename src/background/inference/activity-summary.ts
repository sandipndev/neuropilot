import db, { type ActivitySummary } from "~db"
import { getLanguageModel } from "~model"
import { allUserActivityForLastMs, attentionContent } from "~utils"

const activitySummaryInferenceTask = async () => {
  const ONE_MINUTE_MS = 1 * 60 * 1000
  const recentActivity = await allUserActivityForLastMs(ONE_MINUTE_MS)

  if (recentActivity.length === 0) {
    return
  }

  const PROMPT = `Based on the following user activity data from the last minute, generate a 5-6 word third-person summary describing what the user is doing.

  Activity Data:
  ${attentionContent(recentActivity)}

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

  Return ONLY the summary text, nothing else.`

  const session = await getLanguageModel()
  const summary = await session.prompt(PROMPT.trim())
  session.destroy()

  await db.table<ActivitySummary>("activitySummary").add({
    summary,
    timestamp: Date.now()
  })
}

export default activitySummaryInferenceTask
