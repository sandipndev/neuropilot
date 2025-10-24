/**
 * Attention Update Message Handler
 */

import { SustainedAttention } from "../tracker/cognitive-attention";
import { calculateAttentionDelta } from "../services/attention-tracking-service";
import { saveActivityUserAttention } from "../../db/models/activity-user-attention";

export async function handleAttentionUpdate(data: any): Promise<void> {
  const url = data.url;
  const sustainedAttention: SustainedAttention = data.currentSustainedAttention;

  if (!sustainedAttention?.text || !sustainedAttention.wordsRead || !url) {
    return;
  }

  console.debug({ sustainedAttention, url });

  // Calculate delta using service
  const delta = await calculateAttentionDelta(sustainedAttention, url);

  if (!delta) {
    return; // No new reading progress
  }

  // Save to database
  await saveActivityUserAttention({
    id: delta.deltaHash,
    timestamp: delta.timestamp,
    text_content: delta.deltaText,
    website_id: delta.websiteId,
  });

  console.debug(`Saved attention delta: ${delta.deltaWords} words`);
}
