import { getLanguageModel } from "./models/language";

import { WebsiteActivityWithAttention } from "../../../db/utils/activity";

export const detectFocusArea = async (
  activity: WebsiteActivityWithAttention[]
): Promise<string> => {
  const session = await getLanguageModel();

  // Combine reading content from all websites, ordered by recency.
  const combinedContent = activity
    .map((a) => {
      const content = a.attentionRecords.map((r) => r.text_content).join("\n");
      return `Title: ${a.title}\nURL: ${a.url}\nContent user paid the most attention to:\n${content}`;
    })
    .join("\n\n---\n\n");

  const prompt = `
You are an attention analysis model. Based on the following reading sessions,
determine the user's current main focus area.

Each session represents what the user has been reading recently.

Sessions:
---
${combinedContent}
---

Think about the most recent and dominant topic the user is focusing on.
Respond with only one or two words that best represent this topic.
Do not include punctuation, explanations, or any extra text.
`;

  console.debug({ prompt });

  const focus = await session.prompt(prompt);
  session.destroy();

  return focus.trim();
};
