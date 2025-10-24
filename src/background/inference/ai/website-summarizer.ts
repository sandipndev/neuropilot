import { getLanguageModel } from "./models/language";

import type { ActivityWebsiteVisited } from "../../../db/models/activity-website-visited";
import type { ActivityUserAttention } from "../../../db/models/activity-user-attention";
import type { ActivityUserAttentionImage } from "../../../db/models/image-captions";

export const summarizeWebsiteActivity = async (
  website: ActivityWebsiteVisited,
  attentionRecords: ActivityUserAttention[],
  imageCaptions: ActivityUserAttentionImage[] = []
): Promise<string> => {
  const session = await getLanguageModel();
  const readContent = attentionRecords.map((record) => record.text_content).join(" ");
  
  const imageContent = imageCaptions.length > 0
    ? `\n\nImages the user viewed:\n${imageCaptions.map(img => `- ${img.caption}${img.alt_text ? ` (${img.alt_text})` : ''}`).join('\n')}`
    : '';

  const prompt = `Summarize my activity for this website in a concise manner:

  Title: ${website.title}
  URL: ${website.url}
  Active time: ${Math.round(website.active_time / 1000)}s

  Content the user read:
  ${readContent}
  ${imageContent}

  Provide a concise summary of what the user focused on.`;

  console.debug({ prompt });

  const summary = await session.prompt(prompt);
  session.destroy();

  return summary;
};
