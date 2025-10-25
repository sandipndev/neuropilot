/**
 * Past Wins Model
 * Records of top focus achievements to persist historical data
 */

import { getDB } from "../index";

export interface PastWin {
  id: string; // Unique identifier (hash of focus_item + timestamp)
  focus_item: string; // The focus area that was a "win"
  time_spent: number; // Total time spent in milliseconds
  recorded_at: number; // When this win was recorded
  keywords: string; // JSON string of keywords array for context
}

/**
 * Save a past win record
 */
export async function savePastWin(record: PastWin): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["PastWins"], "readwrite");
    const store = transaction.objectStore("PastWins");

    const request = store.put(record);

    request.onsuccess = () => {
      console.debug(`Saved past win: ${record.focus_item}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save past win: ${request.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all past wins
 * Returns array sorted by recorded_at (most recent first)
 */
export async function getAllPastWins(): Promise<PastWin[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["PastWins"], "readonly");
    const store = transaction.objectStore("PastWins");
    const index = store.index("recorded_at");
    const request = index.openCursor(null, "prev"); // Sort descending (newest first)

    const results: PastWin[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as PastWin);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get past wins: ${request.error?.message}`));
    };
  });
}

/**
 * Get a past win by ID
 */
export async function getPastWin(id: string): Promise<PastWin | undefined> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["PastWins"], "readonly");
    const store = transaction.objectStore("PastWins");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as PastWin | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get past win: ${request.error?.message}`));
    };
  });
}

/**
 * Clear all past wins from the database
 */
export async function clearAllPastWins(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["PastWins"], "readwrite");
    const store = transaction.objectStore("PastWins");

    const request = store.clear();

    request.onsuccess = () => {
      console.debug("Cleared all past wins");
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear past wins: ${request.error?.message}`));
    };
  });
}

/**
 * Helper: Parse keywords from stored JSON string
 */
export function parseKeywords(win: PastWin): string[] {
  try {
    return JSON.parse(win.keywords) as string[];
  } catch {
    return [];
  }
}
