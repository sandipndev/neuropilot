import db, { type Focus } from "~db"
import { NotificationMessageType } from "~default-settings"
import { getLanguageModel } from "~model"
import {
  allUserActivityForLastMs,
  attentionContent,
  getActiveFocus,
  sendNotification,
  type UserActivity
} from "~utils"

const LAST_FOCUS_DRIFT_NOTIFICATION_KEY =
  "last-focus-drift-notification-timestamp"

const focusInferenceTask = async () => {
  const previousFocus = await getActiveFocus()

  // Default: assume no drift if no previous focus (so new focus is saved)
  let focusDrifted = false

  const TEN_MINUTES_MS = 10 * 60 * 1000
  const recentActivity = await allUserActivityForLastMs(TEN_MINUTES_MS)

  if (recentActivity.length === 0) return

  if (previousFocus) {
    focusDrifted = await detectFocusDrift(previousFocus, recentActivity)
  }

  if (!focusDrifted) {
    const updatedSlidingWindowFocus = await detectFocusArea(recentActivity)

    if (updatedSlidingWindowFocus) {
      const newKeywords = previousFocus
        ? [updatedSlidingWindowFocus, ...previousFocus.keywords]
        : [updatedSlidingWindowFocus]

      const keywords = Array.from(new Set(newKeywords))
      const summarizedFocus = await summarizeFocus(keywords)

      if (previousFocus) {
        await db
          .table<Focus>("focus")
          .where("id")
          .equals(previousFocus.id)
          .modify({
            item: summarizedFocus,
            keywords,
            last_updated: Date.now()
          })
      } else {
        await db.table<Focus>("focus").put({
          item: summarizedFocus,
          keywords,
          time_spent: [{ start: Date.now(), end: null }],
          last_updated: Date.now()
        })
      }
    }
  } else if (previousFocus) {
    const now = Date.now()
    await db
      .table<Focus>("focus")
      .where("id")
      .equals(previousFocus.id)
      .modify((focus) => {
        focus.time_spent[focus.time_spent.length - 1].end = now
        focus.last_updated = now
      })
  }

  if (focusDrifted) {
    await sendNotification(
      NotificationMessageType.FOCUS_DRIFT_DETECTED,
      LAST_FOCUS_DRIFT_NOTIFICATION_KEY
    )
  }
}

export default focusInferenceTask

// Focus Drift Detection
const detectFocusDrift = async (
  previousFocus: Focus,
  recentActivity: UserActivity[]
): Promise<boolean> => {
  const PROMPT = `
You are performing focus analysis to check if the user's attention has shifted to a new topic from their previous topic.

Previous focus: ${previousFocus.item}
Previous keywords: ${previousFocus.keywords.join(", ")}

Current attention:
${attentionContent(recentActivity)}

---\n\n

Keep the order in context while returning inference.

Question:
Does the Current attention clearly belong to a different subject (for example, moving from tech to cooking or fashion)?
Or is it still about the same general topic or subtopic, and related concepts within the same domain?
Be sensitive to context - similar words might have different meanings in different contexts.

If it is even related or still part of the same domain then answer no (still focused). 
Otherwise, if you don't find a relation between the previous focus and current attention, then answer yes (shifted).

Answer in one word (yes/no) only, no reasoning.`

  const session = await getLanguageModel()
  const response = await session.prompt(PROMPT.trim())
  session.destroy()

  return response.trim().toLowerCase() === "yes"
}

// Focus Area Detection
const detectFocusArea = async (
  recentActivity: UserActivity[]
): Promise<string | null> => {
  if (recentActivity.length === 0) {
    return null
  }

  const PROMPT = `
You are an attention analysis model. Based on the following reading sessions,
determine the user's primary (current) focus area.

Each session represents what the user has been reading recently.

Sessions:
---
${attentionContent(recentActivity)}
---

Think about the most recent and dominant (prominent) topic or theme the user is focusing on.

- Respond with only one or two words that best represent this topic. 
- If multiple topics exist, identify the most recent or dominant one
- Consider both explicit mentions and implied context.
- Do not include punctuation, explanations, or any extra text.

If you cannot determine the user's current main focus area (probably because 
the user is not reading anything), return "null"`

  const session = await getLanguageModel()
  const focus = await session.prompt(PROMPT)
  session.destroy()

  return focus.trim() === "null" ? null : focus.trim()
}

// Summarize Focus Keywords
const summarizeFocus = async (keywords: string[]): Promise<string> => {
  const PROMPT = `
Reply in one or two words.
What is the single greatest common factor between these:

${keywords.join(", ")}

Note: Be specific enough to be meaningful. Consider both direct and indirect relationships.
If no clear commonality exists, identify the most significant or dominant term.`

  const session = await getLanguageModel()
  const focus = await session.prompt(PROMPT.trim())
  session.destroy()

  return focus.trim()
}
