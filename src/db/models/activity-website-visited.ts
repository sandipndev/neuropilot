/**
 * ActivityWebsitesVisited Model
 * Pure CRUD operations for website visit data
 */

import { getDB } from "../index";

export interface ActivityWebsiteVisited {
  id: string; // Hash of the URL
  timestamp: number;
  url: string;
  title: string;
  metadata: string; // JSON string of meta tags
  summary: string;
  summary_attention_count: number; // Number of attention items used for summary
  opened_time: number;
  closed_time: number | null;
  active_time: number; // Accumulated active time in milliseconds
}

/**
 * Get a website visit record by ID
 */
export async function getWebsiteVisit(id: string): Promise<ActivityWebsiteVisited | undefined> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityWebsitesVisited"], "readonly");
    const store = transaction.objectStore("ActivityWebsitesVisited");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as ActivityWebsiteVisited | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get website visit: ${request.error?.message}`));
    };
  });
}

/**
 * Save or update a website visit record
 */
export async function saveWebsiteVisit(record: ActivityWebsiteVisited): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityWebsitesVisited"], "readwrite");
    const store = transaction.objectStore("ActivityWebsitesVisited");

    const request = store.put(record);

    request.onsuccess = () => {
      console.log(`Saved website visit: ${record.url}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save website visit: ${request.error?.message}`));
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

/**
 * Delete a website visit record
 */
export async function deleteWebsiteVisit(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityWebsitesVisited"], "readwrite");
    const store = transaction.objectStore("ActivityWebsitesVisited");

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete website visit: ${request.error?.message}`));
    };
  });
}
