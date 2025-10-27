import db from "~db"
import { getLanguageModel } from "~model"
import { allUserActivityForLastMs } from "~utils"

import type { Focus, Pulse } from "~db"

const pulseInferenceTask = async () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const recentActivity = await allUserActivityForLastMs(ONE_DAY_MS)

  if (recentActivity.length === 0) {
    return
  }

  const focusData = await db
    .table<Focus>("focus")
    .where("last_updated")
    .above(Date.now() - ONE_DAY_MS)
    .toArray()

  const focusTopics =
    focusData.map((f) => f.item).join(", ") || "various topics"

  const totalActiveTime = recentActivity.reduce(
    (sum, activity) => sum + (activity.active_time || 0),
    0
  )
  const hoursSpent = (totalActiveTime / (1000 * 60 * 60)).toFixed(1)
  const minutesSpent = Math.round(totalActiveTime / (1000 * 60))

  const websiteCount = recentActivity.length
  const recentWebsiteTitles = recentActivity
    .slice(0, 5)
    .map((a) => a.title)
    .filter(Boolean)

  const websiteSummaries = recentActivity
    .filter((a) => a.summary)
    .map((a) => a.summary)
    .join("\n")

  const keyTextLearnings = recentActivity
    .flatMap((a) => a.textAttentions.map((ta) => ta.text))
    .filter((text) => text && text.length > 20)
    .slice(0, 10)
    .join("\n")

  const imageInsights = recentActivity
    .flatMap((a) => a.imageAttentions.map((ia) => ia.caption))
    .filter((caption) => caption && caption.length > 10)
    .slice(0, 5)
    .join("\n")

  const keyLearnings = `Website Summaries:\n${websiteSummaries}\n\nKey Text Content:\n${keyTextLearnings}`

  const PROMPT = `Generate 5 personalized learning progress updates using this data:

Focus Topics: ${focusTopics}
Total Hours: ${hoursSpent}h
Total Minutes: ${minutesSpent} mins
Resources Explored: ${websiteCount}
Recent Pages: ${recentWebsiteTitles.join(", ")}

Key Quotes from Learning:
${keyLearnings}
${imageInsights ? `\nImage Insights:\n${imageInsights}` : ""}

Create 5 diverse updates using these patterns:
  1. Progress celebration: "You've spent Xtime [X mins OR Xh, whichever is more appropriate] on [topic] - great progress!"
  2. Content reminder: "Remember: [quote first 60 chars from Key Quotes]..."
  3. Topic connection: "Connect [topic1] with [topic2] for deeper understanding"
  4. Resource count: "You've explored X resources - try practicing what you learned"
  5. Page review: "Review your notes on [specific page title]"

Rules:
  - Use ACTUAL data from above (exact hours, real quotes, specific titles, true counts)
  - Under 15 words each
  - No generic advice or teaching
  - Casual, encouraging tone
  - Each item unique type
  - No semicolons or colons except after "Remember"

Return ONLY valid JSON array: ["Update 1", "Update 2", "Update 3", "Update 4", "Update 5"], don't wrap it up in quotes or anything else`

  const session = await getLanguageModel()
  const response = await session.prompt(PROMPT.trim())
  session.destroy()

  const jsonResponse = response.replace(/```json\n/g, "").replace(/\n```/g, "")
  const pulseMessages = JSON.parse(jsonResponse.trim())

  if (!Array.isArray(pulseMessages) || pulseMessages.length !== 5) {
    console.error("[Pulse] Invalid response format:", pulseMessages)
    return
  }

  await db.table<Pulse>("pulse").clear()

  const timestamp = Date.now()
  for (const message of pulseMessages) {
    await db.table<Pulse>("pulse").add({
      message,
      timestamp
    })
  }
}

export default pulseInferenceTask
