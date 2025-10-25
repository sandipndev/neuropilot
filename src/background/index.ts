/**
 * Background Script Entry Point
 * Routes messages to appropriate handlers
 */

import { initDB } from "../db";
import { handleAttentionUpdate } from "./handlers/attention-handler";
import { handleWebsiteVisit } from "./handlers/website-visit-handler";
import { handleImageCaptionRequest } from "./handlers/image-caption-handler";
import { handleGetCurrentFocus, handleGetFocusHistory } from "./handlers/focus-handler";
import { scheduler } from "./inference";

// Initialize database on extension load
initDB()
  .then(() => {
    console.debug("NeuroPilot Database initialized");
    scheduler.start();
    console.debug("Inference scheduler started");
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
          sendResponse({ success: true });
          break;

        case "WEBSITE_VISITED":
          await handleWebsiteVisit(message.data);
          sendResponse({ success: true });
          break;

        case "IMAGE_CAPTION_REQUEST":
          const result = await handleImageCaptionRequest(message.data);
          sendResponse(result);
          break;

        case "GET_CURRENT_FOCUS":
          const currentFocus = await handleGetCurrentFocus();
          sendResponse(currentFocus);
          break;

        case "GET_FOCUS_HISTORY":
          const focusHistory = await handleGetFocusHistory();
          sendResponse(focusHistory);
          break;

        default:
          console.debug(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      console.error(`Error handling ${message.type}:`, error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  return true;
});

// Upon installation we want to show an onboarding workflow
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "welcome.html",
    });
  }
});
