import CognitiveAttentionTracker, {
  type AttentionUpdateData,
} from "./background/tracker/cognitive-attention";

// Initialize the cognitive attention tracker in the content script context
// This runs on each web page and has access to the DOM
new CognitiveAttentionTracker({
  debugMode: true,
  cognitiveAttentionThreshold: 3000, // 3s wait for attention
  idleThreshold: 60000, // 1m idle timeout
  mouseHoverThreshold: 1000, // 1s hover bonus
  onUpdate: (data: AttentionUpdateData) => {
    if (data.currentSustainedAttention)
      chrome.runtime.sendMessage({
        type: "ATTENTION_UPDATE",
        data: data.currentSustainedAttention,
      });
  },
}).init();
