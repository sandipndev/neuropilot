import CognitiveAttentionTracker, {
  type AttentionUpdateData,
} from "./background/tracker/cognitive-attention";

// Helper function to safely send messages to background script
function safeSendMessage(message: any) {
  try {
    chrome.runtime.sendMessage(message, () => {
      // Check for extension context invalidated error
      if (chrome.runtime.lastError) {
        // Extension was reloaded, ignore this error silently
        console.debug("Extension context invalidated:", chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    // Extension context invalidated before message could be sent
    console.debug("Failed to send message:", error);
  }
}

// Initialize the cognitive attention tracker in the content script context
// This runs on each web page and has access to the DOM
new CognitiveAttentionTracker({
  debugMode: true,
  cognitiveAttentionThreshold: 3000, // 3s wait for attention
  idleThreshold: 15000, // 1m idle timeout
  mouseHoverThreshold: 1000, // 1s hover bonus
  onUpdate: (data: AttentionUpdateData) => {
    if (data.currentSustainedAttention)
      safeSendMessage({
        type: "ATTENTION_UPDATE",
        data: data,
      });
  },
}).init();

// Website Visit Tracker
// Extracts metadata from page and tracks open/close/active/inactive events

/**
 * Extract all meta tags from the page
 */
function extractMetadata(): string {
  const metaTags: Record<string, string> = {};

  // Extract meta tags with "name" attribute
  document.querySelectorAll("meta[name]").forEach((meta) => {
    const name = meta.getAttribute("name");
    const content = meta.getAttribute("content");
    if (name && content) {
      metaTags[name] = content;
    }
  });

  // Extract meta tags with "property" attribute (e.g., Open Graph tags)
  document.querySelectorAll("meta[property]").forEach((meta) => {
    const property = meta.getAttribute("property");
    const content = meta.getAttribute("content");
    if (property && content) {
      metaTags[property] = content;
    }
  });

  return JSON.stringify(metaTags);
}

/**
 * Send website visit event to background script
 */
function sendWebsiteVisitEvent(eventType: "open" | "close" | "active" | "inactive") {
  safeSendMessage({
    type: "WEBSITE_VISITED",
    data: {
      url: window.location.href,
      title: document.title,
      metadata: extractMetadata(),
      eventType,
      timestamp: Date.now(),
    },
  });
}

// Send "open" event when page loads
sendWebsiteVisitEvent("open");

// Send "active" event initially if page is visible
if (!document.hidden) {
  sendWebsiteVisitEvent("active");
}

// Track page visibility changes (active/inactive)
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sendWebsiteVisitEvent("inactive");
  } else {
    sendWebsiteVisitEvent("active");
  }
});

// Send "close" event when page is about to unload
window.addEventListener("beforeunload", () => {
  sendWebsiteVisitEvent("close");
});

// Also track when page loses focus (user switches tabs)
window.addEventListener("blur", () => {
  if (!document.hidden) {
    sendWebsiteVisitEvent("inactive");
  }
});

// Track when page gains focus
window.addEventListener("focus", () => {
  if (!document.hidden) {
    sendWebsiteVisitEvent("active");
  }
});
