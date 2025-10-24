import { getLanguageModel } from "./models/language";

import type { ActivityWebsiteVisited } from "../../../db/models/activity-website-visited";
import type { ActivityUserAttention } from "../../../db/models/activity-user-attention";

export const summarizeWebsiteActivity = async (
  website: ActivityWebsiteVisited,
  attentionRecords: ActivityUserAttention[]
): Promise<string> => {
  const session = await getLanguageModel();
  const readContent = attentionRecords.map((record) => record.text_content).join(" ");

  const prompt = `Summarize my activity for this website in a concise manner:

Title: ${website.title}
URL: ${website.url}
Active time: ${Math.round(website.active_time / 1000)}s

Content the user read:
${readContent}

Provide a concise summary of what the user focused on.`;

  console.debug({ prompt });

  const summary = await session.prompt(prompt);
  session.destroy();

  return summary;
};
