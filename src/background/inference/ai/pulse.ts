/**
 * Pulse Generation AI
 * Generates personalized learning progress updates
 */

import { getLanguageModel } from "./models/language";
import { WebsiteActivityWithAttention } from "../../../db/utils/activity";
import { FocusWithParsedData } from "../../../api/queries/focus";
import type { ActivityUserAttentionImage } from "../../../db/models/image-captions";

export interface PulseGenerationData {
  focusRecords: FocusWithParsedData[];
  recentWebsites: WebsiteActivityWithAttention[];
  imageAttention?: ActivityUserAttentionImage[];
}

export async function generatePulse(data: PulseGenerationData): Promise<string[]> {
  const { focusRecords, recentWebsites, imageAttention = [] } = data;

  // Calculate aggregated data
  const focusTopics = focusRecords.map((f) => f.focus_item).join(", ") || "various topics";
  const totalHoursMs = focusRecords.reduce((acc, f) => acc + f.total_time, 0);
  const hoursSpent = (totalHoursMs / (1000 * 60 * 60)).toFixed(1);
  const websiteCount = recentWebsites.length;
  const recentWebsiteTitles = recentWebsites.slice(0, 5).map((w) => w.title);

  // Extract key learnings from website summaries
  const keyLearnings = recentWebsites
    .filter((w) => w.summary && w.summary.trim().length > 0)
    .slice(0, 3)
    .map((w) => w.summary)
    .join("\n");

  const imageInsights = imageAttention.length > 0
    ? `\n\nVisual Content Explored:\n${imageAttention.slice(0, 5).map(img => `- ${img.caption}`).join('\n')}`
    : '';

  const prompt = `Generate 5 personalized learning progress updates using this data:

  Focus Topics: ${focusTopics}
  Total Hours: ${hoursSpent}h
  Resources Explored: ${websiteCount}
  Recent Pages: ${recentWebsiteTitles.join(", ")}

  Key Quotes from Learning:
  ${keyLearnings}
  ${imageInsights}

  Create 5 diverse updates using these patterns:
    1. Progress celebration: "You've spent Xh on [topic] - great progress!"
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

  Return ONLY valid JSON array: ["Update 1", "Update 2", "Update 3", "Update 4", "Update 5"], don't wrap it up in quotes or anything else`;

  try {
    const model = await getLanguageModel();
    const response = await model.prompt(prompt);

    // response is of the format ```json\n["",\n"",\n"",\n"",\n""]\n```
    // we need to remove the ```json\n and \n```
    const jsonResponse = response.replace(/```json\n/g, "").replace(/\n```/g, "");

    // Parse JSON response
    const pulses = JSON.parse(jsonResponse);

    if (Array.isArray(pulses) && pulses.length === 5) {
      return pulses;
    }

    throw new Error("Invalid pulse response format");
  } catch (error) {
    console.error("Failed to generate pulse:", error);

    // Fallback pulses if AI fails
    return [
      `You've spent some time learning - keep it up!`,
      "Remember to review what you learned today",
      `Explored ${websiteCount} resources - great curiosity!`,
      "Connect your learning topics for deeper insights",
      "Take a moment to reflect on your progress",
    ];
  }
}
