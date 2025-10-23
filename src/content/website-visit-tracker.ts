/**
 * Website Visit Tracker
 * Tracks page open/close/active/inactive events
 */

import { safeSendMessage } from "./utils/messaging";

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
function sendWebsiteVisitEvent(eventType: "open" | "close" | "active" | "inactive"): void {
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

/**
 * Initialize website visit tracking
 */
export function initializeWebsiteVisitTracker(): void {
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
}
