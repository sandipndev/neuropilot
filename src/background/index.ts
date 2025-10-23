import { SustainedAttention } from "./tracker/cognitive-attention";
import { initDB } from "../db";
import { saveActivityUserAttention } from "../db/models/activity-user-attention";

// Initialize database on extension load
initDB()
  .then(() => {
    console.log("NeuroPilot Database initialized");
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "ATTENTION_UPDATE") {
    const { data } = message;
    const sustainedAttention: SustainedAttention = data;

    console.log({ sustainedAttention });

    // Save sustained attention data (delta tracking handled internally)
    if (sustainedAttention?.text && sustainedAttention.wordsRead) {
      saveActivityUserAttention(sustainedAttention).catch((error) => {
        console.error("Failed to save activity:", error);
      });
    }
  }

  return true;
});
