/**
 * Activity Summary Generation AI
 * Generates short third-person summaries of user activity in the last minute
 */

import { getLanguageModel } from "./models/language";
import { WebsiteActivityWithAttention } from "../../../db/utils/activity";
import type { ActivityUserAttentionImage } from "../../../db/models/image-captions";

export interface ActivitySummaryData {
  recentWebsites: WebsiteActivityWithAttention[];
  recentAttention: string[];
  imageAttention?: ActivityUserAttentionImage[];
}

export async function generateActivitySummary(data: ActivitySummaryData): Promise<string> {
  const { recentWebsites, recentAttention, imageAttention = [] } = data;

  // If no activity, return a default message
  if (recentWebsites.length === 0 && recentAttention.length === 0 && imageAttention.length === 0) {
    return "You are idle";
  }

  // Gather activity context
  const websiteTitles = recentWebsites.map((w) => w.title).join(", ");
  const websiteSummaries = recentWebsites
    .filter((w) => w.summary && w.summary.trim().length > 0)
    .map((w) => w.summary)
    .join("; ");

  const attentionText = recentAttention.slice(0, 10).join(" ");
  const imageDescriptions =
    imageAttention.length > 0
      ? imageAttention
          .slice(0, 3)
          .map((img) => img.caption)
          .join(", ")
      : "";

  const prompt = `Based on the following user activity data from the last minute, generate a 5-6 word third-person summary describing what the user is doing.

Activity Data:
Website Titles: ${websiteTitles || "None"}
Website Summaries: ${websiteSummaries || "None"}
Text Content Read: ${attentionText || "None"}
Images Viewed: ${imageDescriptions || "None"}

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

Return ONLY the summary text, nothing else.`;

  try {
    const model = await getLanguageModel();
    const response = await model.prompt(prompt);

    // Clean up response - remove any quotes or extra whitespace
    const summary = response.trim().replace(/^["']|["']$/g, "");

    // Validate word count (5-6 words)
    const wordCount = summary.split(/\s+/).length;
    if (wordCount >= 5 && wordCount <= 6 && summary.length > 0) {
      return summary;
    }

    // If invalid, try to use the response anyway but truncate if needed
    const words = summary.split(/\s+/);
    if (words.length > 6) {
      return words.slice(0, 6).join(" ");
    } else if (words.length < 5 && words.length > 0) {
      return summary; // Accept it even if slightly short
    }

    throw new Error("Invalid summary response format");
  } catch (error) {
    console.error("Failed to generate activity summary:", error);

    // Fallback based on available data
    if (recentWebsites.length > 0) {
      const firstWebsite = recentWebsites[0];
      const title = firstWebsite.title.split(" ").slice(0, 4).join(" ");
      return `You are browsing ${title}`;
    } else if (recentAttention.length > 0) {
      return "You are reading content";
    } else if (imageAttention.length > 0) {
      return "You are viewing images";
    }

    return "You are browsing web";
  }
}
