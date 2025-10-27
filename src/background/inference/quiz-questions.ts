import db from "~db"
import { getLanguageModel } from "~model"
import { allUserActivityForLastMs } from "~utils"

import type { Focus } from "./focus"

type QuizQuestion = {
  question: string
  option_1: string
  option_2: string
  correct_answer: number
  timestamp: number
}

const quizQuestionsInferenceTask = async () => {
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

  const websiteCount = recentActivity.length
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

  const PROMPT = `Generate 5 quiz questions to test understanding of the user's recent learning activity.

Learning Data:
Focus Topics: ${focusTopics}
Resources Explored: ${websiteCount}
Recent Pages: ${recentActivity.map((a) => a.title).join(", ")}

Key Content from Learning:
${keyLearnings}
${imageInsights}

Create 5 quiz questions that:
1. Test concepts from the key content above
2. Are specific to what the user learned (not generic)
3. Have 2 answer options each
4. Are clear and concise
5. One option should be correct, the other should be a plausible distractor

Rules:
- Questions should be based on ACTUAL content from above
- Questions should be under 100 characters
- Each option should be under 80 characters
- Make questions specific and factual, not generic
- correct_answer should be 1 or 2

Return ONLY valid JSON array in this exact format:
[
  {
    "question": "Question text here?",
    "option_1": "First option",
    "option_2": "Second option",
    "correct_answer": 1
  },
  {
    "question": "Question text here?",
    "option_1": "First option",
    "option_2": "Second option",
    "correct_answer": 2
  }
]

Do not wrap in markdown code blocks or add any other text.`

  const model = await getLanguageModel()
  const response = await model.prompt(PROMPT)

  // Clean up the response - remove markdown code blocks if present
  let jsonResponse = response.trim()
  jsonResponse = jsonResponse.replace(/```json\n/g, "").replace(/\n```/g, "")
  jsonResponse = jsonResponse.replace(/```\n/g, "").replace(/\n```/g, "")
  jsonResponse = jsonResponse.trim()

  // Parse JSON response
  const quizQuestions = JSON.parse(jsonResponse)

  if (Array.isArray(quizQuestions) && quizQuestions.length === 5) {
    // Validate the structure
    const validQuestions = quizQuestions.filter(
      (q) =>
        q.question &&
        q.option_1 &&
        q.option_2 &&
        (q.correct_answer === 1 || q.correct_answer === 2)
    )

    if (validQuestions.length === 5) {
      await db.table<QuizQuestion>("quizQuestions").clear()

      const timestamp = Date.now()
      for (const {
        question,
        option_1,
        option_2,
        correct_answer
      } of validQuestions) {
        await db.table<QuizQuestion>("quizQuestions").add({
          question,
          option_1,
          option_2,
          correct_answer,
          timestamp
        })
      }
    }
  }
}

export default quizQuestionsInferenceTask
