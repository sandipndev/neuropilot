import { getLanguageModel } from "./models/language";

import { Focus, parseKeywords } from "../../../db/models/focus";
import { WebsiteActivityWithAttention } from "../../../db/utils/activity";

/**
 * Detects if the user's focus has drifted from their previous topic
 * @param previousFocus - The previous focus record with focus_item and keywords
 * @param newAttention - The new website activity with attention data
 * @returns Promise<boolean> - true if focus has drifted, false if still focused
 */
export const detectFocusDrift = async (
  previousFocus: Focus,
  newAttention: WebsiteActivityWithAttention[]
): Promise<boolean> => {
  const session = await getLanguageModel();

  // Parse keywords from the previous focus
  const keywords = parseKeywords(previousFocus);

  // Format the new attention data
  const attentionContent = newAttention
    .map(
      (a) => `
Title: ${a.title}
URL: ${a.url}
Content user is paying attention to:
${a.attentionRecords.map((r) => r.text_content).join(" ")}`
    )
    .join("\n\n---\n\n");

  const prompt = `
You are checking if the user's attention has changed from their previous topic.

Previous focus: ${previousFocus.focus_item}
Previous keywords: ${keywords.join(", ")}

Current attention:
${attentionContent}

Question:
Does the current attention clearly belong to a different subject (for example, moving from tech to cooking or fashion)?
Or is it still about the same general topic or subtopic?

If it is even related or still part of the same domain then answer no (still focused). 
Otherwise, if you don't find a relation between the previous focus and current attention, then answer yes (shifted).

Answer in one word (yes/no) only, no reasoning.
`;

  const response = await session.prompt(prompt);
  session.destroy();

  const answer = response.trim().toLowerCase();
  console.log({ where: "detectFocusDrift", previousFocus, newAttention, prompt, answer });

  return answer === "yes";
};
