/**
 * Pulse Model
 * Pure CRUD operations for pulse messages
 */

import { getDB } from "../index";
import { hashString } from "../utils/hash";

export interface Pulse {
  id: string;
  message: string;
  timestamp: number;
}

/**
 * Save pulse messages (replaces all existing pulses)
 */
export async function savePulses(messages: string[]): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  // Generate all pulse records with hashed IDs
  const pulses: Pulse[] = await Promise.all(
    messages.map(async (message, index) => ({
      id: `${await hashString(message)}-${index}`,
      message,
      timestamp: now,
    }))
  );

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Pulse"], "readwrite");
    const store = transaction.objectStore("Pulse");

    // Clear existing pulses first
    const clearRequest = store.clear();

    clearRequest.onsuccess = () => {
      // Add new pulses
      let completed = 0;
      const total = pulses.length;

      if (total === 0) {
        console.debug("No pulse messages to save");
        resolve();
        return;
      }

      pulses.forEach((pulse) => {
        const putRequest = store.put(pulse);

        putRequest.onsuccess = () => {
          completed++;
          if (completed === total) {
            console.debug(`Saved ${total} pulse messages`);
            resolve();
          }
        };

        putRequest.onerror = () => {
          reject(new Error(`Failed to save pulse: ${putRequest.error?.message}`));
        };
      });
    };

    clearRequest.onerror = () => {
      reject(new Error(`Failed to clear pulses: ${clearRequest.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get all pulse messages
 */
export async function getAllPulses(): Promise<Pulse[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Pulse"], "readonly");
    const store = transaction.objectStore("Pulse");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as Pulse[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get pulses: ${request.error?.message}`));
    };
  });
}

/**
 * Delete all pulse messages
 */
export async function clearPulses(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["Pulse"], "readwrite");
    const store = transaction.objectStore("Pulse");

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear pulses: ${request.error?.message}`));
    };
  });
}
