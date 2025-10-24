/**
 * ActivityUserAttention Model
 * Pure CRUD operations for user attention data
 */

import { getDB } from "../index";

export interface ActivityUserAttention {
  id: string; // Hash of the delta text content
  timestamp: number;
  text_content: string; // Only the delta (newly read portion)
  website_id: string; // Hash of the URL (links to ActivityWebsitesVisited)
}

/**
 * Save user attention record
 */
export async function saveActivityUserAttention(record: ActivityUserAttention): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttention"], "readwrite");
    const store = transaction.objectStore("ActivityUserAttention");

    const request = store.put(record);

    request.onsuccess = () => {
      console.log(`Saved attention: ${record.text_content.substring(0, 50)}...`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save activity: ${request.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all activity user attention records
 * Returns array sorted by timestamp (most recent first)
 */
export async function getActivityUserAttention(): Promise<ActivityUserAttention[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttention"], "readonly");
    const store = transaction.objectStore("ActivityUserAttention");
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev"); // Sort descending (newest first)

    const results: ActivityUserAttention[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as ActivityUserAttention);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get activities: ${request.error?.message}`));
    };
  });
}

/**
 * Get attention records by website_id
 * Returns array sorted by timestamp (most recent first)
 */
export async function getActivityUserAttentionByWebsite(
  websiteId: string
): Promise<ActivityUserAttention[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttention"], "readonly");
    const store = transaction.objectStore("ActivityUserAttention");
    const index = store.index("website_id");
    const request = index.openCursor(IDBKeyRange.only(websiteId));

    const results: ActivityUserAttention[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as ActivityUserAttention);
        cursor.continue();
      } else {
        results.sort((a, b) => a.timestamp - b.timestamp);
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get activities by website: ${request.error?.message}`));
    };
  });
}
