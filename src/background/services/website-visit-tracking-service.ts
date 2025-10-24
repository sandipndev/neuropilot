/**
 * Website Visit Tracking Service
 * Handles active time calculation and visit event processing
 */

import { hashString } from "../../db/utils/hash";
import { ActivityWebsiteVisited } from "../../db/models/activity-website-visited";

// Track when the page became active (for calculating active time)
const activeStartTimes = new Map<string, number>();

export interface WebsiteVisitEvent {
  url: string;
  title: string;
  metadata: string;
  eventType: "open" | "close" | "active" | "inactive";
  timestamp: number;
}

export interface WebsiteVisitUpdate {
  urlHash: string;
  record: ActivityWebsiteVisited;
}

/**
 * Process a website visit event and return the updated record
 * Returns null if event should be ignored
 */
export async function processWebsiteVisitEvent(
  event: WebsiteVisitEvent,
  existingRecord?: ActivityWebsiteVisited
): Promise<WebsiteVisitUpdate | null> {
  const { url, title, metadata, eventType, timestamp } = event;
  const urlHash = await hashString(url);

  let record: ActivityWebsiteVisited;

  if (existingRecord) {
    // Update existing record
    record = { ...existingRecord };

    switch (eventType) {
      case "open":
        // Reset for a new visit
        record.opened_time = timestamp;
        record.closed_time = null;
        record.active_time = 0;
        activeStartTimes.set(urlHash, timestamp);
        break;

      case "close":
        record.closed_time = timestamp;
        // If page was active when closed, add that time
        const activeStart = activeStartTimes.get(urlHash);
        if (activeStart) {
          record.active_time += timestamp - activeStart;
          activeStartTimes.delete(urlHash);
        }
        break;

      case "active":
        // Mark when page became active
        activeStartTimes.set(urlHash, timestamp);
        break;

      case "inactive":
        // Calculate and add active time since last active event
        const lastActiveStart = activeStartTimes.get(urlHash);
        if (lastActiveStart) {
          record.active_time += timestamp - lastActiveStart;
          activeStartTimes.delete(urlHash);
        }
        break;
    }

    record.timestamp = timestamp;
  } else {
    // Create new record (only for "open" events)
    if (eventType !== "open") {
      return null;
    }

    record = {
      id: urlHash,
      timestamp,
      url,
      title,
      metadata,
      summary: "",
      summary_attention_count: 0,
      opened_time: timestamp,
      closed_time: null,
      active_time: 0,
    };

    activeStartTimes.set(urlHash, timestamp);
  }

  return { urlHash, record };
}

/**
 * Clear active time tracking for a URL (useful for cleanup)
 */
export function clearActiveTime(urlHash: string): void {
  activeStartTimes.delete(urlHash);
}

/**
 * Clear all active time tracking
 */
export function clearAllActiveTimes(): void {
  activeStartTimes.clear();
}
