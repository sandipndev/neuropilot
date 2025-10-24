/**
 * Focus Model
 * Pure CRUD operations for focus tracking data
 */

import { getDB } from "../index";
import { hashString } from "../utils/hash";

export interface TimeSpent {
  start: number; // Timestamp
  stop: number | null; // Timestamp, null if currently active
}

export interface Focus {
  id: string; // Unique identifier for the focus record
  focus_item: string; // Very small - 1/2 words representing the focus area
  keywords: string; // JSON string of keywords array
  time_spent: string; // JSON string of TimeSpent array
  last_updated: number; // Timestamp for sorting and tracking
}

/**
 * Save or update a focus record
 */
export async function saveFocus(record: Focus): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readwrite");
    const store = transaction.objectStore("Focus");

    const request = store.put(record);

    request.onsuccess = () => {
      console.debug(`Saved focus: ${record.focus_item}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save focus: ${request.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get a focus record by ID
 */
export async function getFocus(id: string): Promise<Focus | undefined> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readonly");
    const store = transaction.objectStore("Focus");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as Focus | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get focus: ${request.error?.message}`));
    };
  });
}

/**
 * Get a focus record by focus_item
 */
export async function getFocusByItem(focusItem: string): Promise<Focus | undefined> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readonly");
    const store = transaction.objectStore("Focus");
    const index = store.index("focus_item");
    const request = index.get(focusItem);

    request.onsuccess = () => {
      resolve(request.result as Focus | undefined);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get focus by item: ${request.error?.message}`));
    };
  });
}

/**
 * Get all focus records
 * Returns array sorted by last_updated (most recent first)
 */
export async function getAllFocus(): Promise<Focus[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readonly");
    const store = transaction.objectStore("Focus");
    const index = store.index("last_updated");
    const request = index.openCursor(null, "prev"); // Sort descending (newest first)

    const results: Focus[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        results.push(cursor.value as Focus);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get focus records: ${request.error?.message}`));
    };
  });
}

/**
 * Get currently active focus (where time_spent has a null stop time)
 */
export async function getActiveFocus(): Promise<Focus | undefined> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readonly");
    const store = transaction.objectStore("Focus");
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;

      if (cursor) {
        const focus = cursor.value as Focus;
        const timeSpent = JSON.parse(focus.time_spent) as TimeSpent[];

        // Check if there's an active time period (stop is null)
        if (timeSpent.some((ts) => ts.stop === null)) {
          resolve(focus);
          return;
        }

        cursor.continue();
      } else {
        resolve(undefined);
      }
    };

    request.onerror = () => {
      reject(new Error(`Failed to get active focus: ${request.error?.message}`));
    };
  });
}

/**
 * Delete a focus record
 */
export async function deleteFocus(id: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Focus"], "readwrite");
    const store = transaction.objectStore("Focus");

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete focus: ${request.error?.message}`));
    };
  });
}

/**
 * Helper: Parse keywords from stored JSON string
 */
export function parseKeywords(focus: Focus): string[] {
  try {
    return JSON.parse(focus.keywords) as string[];
  } catch {
    return [];
  }
}

/**
 * Helper: Parse time_spent from stored JSON string
 */
export function parseTimeSpent(focus: Focus): TimeSpent[] {
  try {
    return JSON.parse(focus.time_spent) as TimeSpent[];
  } catch {
    return [];
  }
}

/**
 * Persist a focus item
 * Handles the logic of closing previous focus and creating/updating current focus
 */
export async function persistFocus(focusItem: string): Promise<void> {
  const now = Date.now();
  const focusId = await hashString(focusItem.toLowerCase());

  // Get currently active focus (if any)
  const activeFocus = await getActiveFocus();

  // If there's an active focus and it's different from the new one, close it
  if (activeFocus && activeFocus.focus_item !== focusItem) {
    const timeSpent = parseTimeSpent(activeFocus);
    // Close the last time period
    if (timeSpent.length > 0 && timeSpent[timeSpent.length - 1].stop === null) {
      timeSpent[timeSpent.length - 1].stop = now;
    }

    await saveFocus({
      ...activeFocus,
      time_spent: JSON.stringify(timeSpent),
      last_updated: now,
    });
  }

  // Check if this focus already exists
  const existingFocus = await getFocusByItem(focusItem);

  if (existingFocus) {
    // Update existing focus
    const timeSpent = parseTimeSpent(existingFocus);

    // If the last time period is still open (shouldn't happen, but handle it)
    if (timeSpent.length > 0 && timeSpent[timeSpent.length - 1].stop === null) {
      // Just update the last_updated timestamp
      await saveFocus({
        ...existingFocus,
        last_updated: now,
      });
    } else {
      // Add a new time period
      timeSpent.push({
        start: now,
        stop: null,
      });

      await saveFocus({
        ...existingFocus,
        time_spent: JSON.stringify(timeSpent),
        last_updated: now,
      });
    }
  } else {
    // Create new focus record
    const newFocus = {
      id: focusId,
      focus_item: focusItem,
      keywords: JSON.stringify([focusItem]), // Start with the focus item as the only keyword
      time_spent: JSON.stringify([
        {
          start: now,
          stop: null,
        },
      ] as TimeSpent[]),
      last_updated: now,
    };

    await saveFocus(newFocus);
  }
}
