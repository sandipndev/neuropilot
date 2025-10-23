/**
 * ActivityWebsitesVisited Model
 * Stores website visit tracking data
 */

import { getDB } from "../index";

export interface ActivityWebsiteVisited {
  id: string; // Hash of the URL
  timestamp: number;
  url: string;
  title: string;
  metadata: string; // JSON string of meta tags
  summary: string;
  opened_time: number;
  closed_time: number | null;
  active_time: number; // Accumulated active time in milliseconds
}

export interface WebsiteVisitEvent {
  url: string;
  title: string;
  metadata: string;
  eventType: "open" | "close" | "active" | "inactive";
  timestamp: number;
}

/**
 * Generate a hash from URL
 */
export async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// Track when the page became active (for calculating active time)
const activeStartTimes = new Map<string, number>();

/**
 * Save or update website visit data
 */
export async function saveWebsiteVisit(event: WebsiteVisitEvent): Promise<void> {
  const { url, title, metadata, eventType, timestamp } = event;

  const db = await getDB();
  const urlHash = await hashUrl(url);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityWebsitesVisited"], "readwrite");
    const store = transaction.objectStore("ActivityWebsitesVisited");

    // First, try to get existing record
    const getRequest = store.get(urlHash);

    getRequest.onsuccess = () => {
      const existingRecord = getRequest.result as ActivityWebsiteVisited | undefined;

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
          console.warn(`Received ${eventType} event for non-existent record: ${url}`);
          resolve();
          return;
        }

        record = {
          id: urlHash,
          timestamp,
          url,
          title,
          metadata,
          summary: "",
          opened_time: timestamp,
          closed_time: null,
          active_time: 0,
        };

        activeStartTimes.set(urlHash, timestamp);
      }

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        console.log(`Saved website visit (${eventType}): ${url}`);
        resolve();
      };

      putRequest.onerror = () => {
        reject(new Error(`Failed to save website visit: ${putRequest.error?.message}`));
      };
    };

    getRequest.onerror = () => {
      reject(new Error(`Failed to get existing record: ${getRequest.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all website visit records
 * Returns array sorted by timestamp (most recent first)
 */
export async function getActivityWebsitesVisited(): Promise<ActivityWebsiteVisited[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityWebsitesVisited"], "readonly");
    const store = transaction.objectStore("ActivityWebsitesVisited");
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev"); // Sort descending (newest first)

    const results: ActivityWebsiteVisited[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as ActivityWebsiteVisited);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get website visits: ${request.error?.message}`));
    };
  });
}
