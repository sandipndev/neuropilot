import CognitiveAttentionTracker, {
  type AttentionUpdateData,
} from "./background/tracker/cognitive-attention";

// Initialize the cognitive attention tracker in the content script context
// This runs on each web page and has access to the DOM
new CognitiveAttentionTracker({
  debugMode: false,
  cognitiveAttentionThreshold: 4000, // 4s wait for attention
  idleThreshold: 20000, // 20s idle timeout
  mouseHoverThreshold: 2000, // 2s hover bonus
  onUpdate: (data: AttentionUpdateData) => {
    if (data.currentSustainedAttention)
      chrome.runtime.sendMessage({
        type: "ATTENTION_UPDATE",
        data: data.currentSustainedAttention,
      });
  },
}).init();
