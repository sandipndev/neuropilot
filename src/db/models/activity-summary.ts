/**
 * ActivitySummary Model
 * Pure CRUD operations for activity summary messages
 */

import { getDB } from "../index";
import { hashString } from "../utils/hash";

export interface ActivitySummary {
  id: string;
  summary: string;
  timestamp: number;
}

/**
 * Save activity summary (creates new record)
 */
export async function saveActivitySummary(summary: string): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  const record: ActivitySummary = {
    id: `${await hashString(summary)}-${now}`,
    summary,
    timestamp: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivitySummary"], "readwrite");
    const store = transaction.objectStore("ActivitySummary");

    const request = store.put(record);

    request.onsuccess = () => {
      console.debug(`Saved activity summary: ${summary}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save activity summary: ${request.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all activity summaries
 * Returns array sorted by timestamp (most recent first)
 */
export async function getAllActivitySummaries(): Promise<ActivitySummary[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivitySummary"], "readonly");
    const store = transaction.objectStore("ActivitySummary");
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev"); // Sort descending (newest first)

    const results: ActivitySummary[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as ActivitySummary);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get activity summaries: ${request.error?.message}`));
    };
  });
}

/**
 * Get recent activity summaries within a time range
 */
export async function getRecentActivitySummaries(
  sinceTimestamp: number
): Promise<ActivitySummary[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivitySummary"], "readonly");
    const store = transaction.objectStore("ActivitySummary");
    const index = store.index("timestamp");
    const range = IDBKeyRange.lowerBound(sinceTimestamp);
    const request = index.openCursor(range, "prev");

    const results: ActivitySummary[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as ActivitySummary);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get recent activity summaries: ${request.error?.message}`));
    };
  });
}

/**
 * Delete activity summaries older than a certain timestamp
 */
export async function deleteOldActivitySummaries(beforeTimestamp: number): Promise<number> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivitySummary"], "readwrite");
    const store = transaction.objectStore("ActivitySummary");
    const index = store.index("timestamp");
    const range = IDBKeyRange.upperBound(beforeTimestamp);
    const request = index.openCursor(range);

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.debug(`Deleted ${deletedCount} old activity summaries`);
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete old activity summaries: ${request.error?.message}`));
    };
  });
}
