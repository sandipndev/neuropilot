/**
 * Attention Tracker
 * Initializes and manages cognitive attention tracking
 */

import CognitiveAttentionTracker, {
  type AttentionUpdateData,
} from "../background/tracker/cognitive-attention";
import { safeSendMessage } from "./utils/messaging";

/**
 * Initialize attention tracking on the page
 */
export function initializeAttentionTracker(): void {
  new CognitiveAttentionTracker({
    debugMode: false,
    cognitiveAttentionThreshold: 3000, // 3s wait for attention
    idleThreshold: 15000, // 15s idle timeout
    mouseHoverThreshold: 1000, // 1s hover bonus
    onUpdate: (data: AttentionUpdateData) => {
      if (data.currentSustainedAttention) {
        safeSendMessage({
          type: "ATTENTION_UPDATE",
          data: data,
        });
      }
    },
  }).init();
}
