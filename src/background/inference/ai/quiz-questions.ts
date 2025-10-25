/**
 * Quiz Questions Generation AI
 * Generates quiz questions based on user's learning activity
 */

import { getLanguageModel } from "./models/language";
import { WebsiteActivityWithAttention } from "../../../db/utils/activity";
import { FocusWithParsedData } from "../../../api/queries/focus";
import type { ActivityUserAttentionImage } from "../../../db/models/image-captions";

export interface QuizGenerationData {
  focusRecords: FocusWithParsedData[];
  recentWebsites: WebsiteActivityWithAttention[];
  imageAttention?: ActivityUserAttentionImage[];
}

export interface GeneratedQuizQuestion {
  question: string;
  option_1: string;
  option_2: string;
  correct_answer: 1 | 2;
}

export async function generateQuizQuestions(
  data: QuizGenerationData
): Promise<GeneratedQuizQuestion[]> {
  const { focusRecords, recentWebsites, imageAttention = [] } = data;

  // Calculate aggregated data
  const focusTopics = focusRecords.map((f) => f.focus_item).join(", ") || "various topics";
  const websiteCount = recentWebsites.length;

  // Extract key learnings from website summaries
  const keyLearnings = recentWebsites
    .filter((w) => w.summary && w.summary.trim().length > 0)
    .slice(0, 5)
    .map((w) => `${w.title}: ${w.summary}`)
    .join("\n");

  const imageInsights =
    imageAttention.length > 0
      ? `\n\nVisual Content Explored:\n${imageAttention
          .slice(0, 5)
          .map((img) => `- ${img.caption}`)
          .join("\n")}`
      : "";

  const prompt = `Generate 5 quiz questions to test understanding of the user's recent learning activity.

Learning Data:
Focus Topics: ${focusTopics}
Resources Explored: ${websiteCount}
Recent Pages: ${recentWebsites
    .slice(0, 5)
    .map((w) => w.title)
    .join(", ")}

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

Do not wrap in markdown code blocks or add any other text.`;

  try {
    const model = await getLanguageModel();
    const response = await model.prompt(prompt);

    // Clean up the response - remove markdown code blocks if present
    let jsonResponse = response.trim();
    jsonResponse = jsonResponse.replace(/```json\n/g, "").replace(/\n```/g, "");
    jsonResponse = jsonResponse.replace(/```\n/g, "").replace(/\n```/g, "");
    jsonResponse = jsonResponse.trim();

    // Parse JSON response
    const quizQuestions = JSON.parse(jsonResponse);

    if (Array.isArray(quizQuestions) && quizQuestions.length === 5) {
      // Validate the structure
      const validQuestions = quizQuestions.filter(
        (q) =>
          q.question &&
          q.option_1 &&
          q.option_2 &&
          (q.correct_answer === 1 || q.correct_answer === 2)
      );

      if (validQuestions.length === 5) {
        return validQuestions;
      }
    }

    throw new Error("Invalid quiz questions response format");
  } catch (error) {
    console.error("Failed to generate quiz questions:", error);

    // Fallback quiz questions if AI fails
    return [
      {
        question: "What topic have you been learning?",
        option_1: focusTopics.split(",")[0] || "Various topics",
        option_2: "Something unrelated",
        correct_answer: 1,
      },
      {
        question: `How many resources did you explore recently?`,
        option_1: `${websiteCount} resources`,
        option_2: `${Math.floor(websiteCount / 2)} resources`,
        correct_answer: 1,
      },
      {
        question: "What should you do after learning?",
        option_1: "Review and practice",
        option_2: "Forget about it",
        correct_answer: 1,
      },
      {
        question: "What helps deepen understanding?",
        option_1: "Connecting topics together",
        option_2: "Learning in isolation",
        correct_answer: 1,
      },
      {
        question: "What's a sign of good learning progress?",
        option_1: "Consistent time investment",
        option_2: "Avoiding challenges",
        correct_answer: 1,
      },
    ];
  }
}
