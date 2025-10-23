/**
 * Safe messaging utilities for content scripts
 */

/**
 * Safely send messages to background script with error handling
 */
export function safeSendMessage(message: any): void {
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
