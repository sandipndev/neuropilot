/**
 * Background Script Entry Point
 * Routes messages to appropriate handlers
 */

import { initDB } from "../db";
import { handleAttentionUpdate } from "./handlers/attention-handler";
import { handleWebsiteVisit } from "./handlers/website-visit-handler";
import { scheduler } from "./inference";

// Initialize database on extension load
initDB()
  .then(() => {
    console.log("NeuroPilot Database initialized");
    scheduler.start();
    console.log("Inference scheduler started");
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
  });

// Message router
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle messages asynchronously
  (async () => {
    try {
      switch (message.type) {
        case "ATTENTION_UPDATE":
          await handleAttentionUpdate(message.data);
          break;

        case "WEBSITE_VISITED":
          await handleWebsiteVisit(message.data);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling ${message.type}:`, error);
    } finally {
      sendResponse({ success: true });
    }
  })();

  return true;
});
