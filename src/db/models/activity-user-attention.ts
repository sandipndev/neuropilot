/**
 * ActivityUserAttention Model
 * Stores user attention data with delta tracking
 */

import { getDB } from "../index";
import { SustainedAttention } from "../../background/tracker/cognitive-attention";
import { hashString } from "../utils/hash";

export interface ActivityUserAttention {
  id: string; // Hash of the delta text content
  timestamp: number;
  text_content: string; // Only the delta (newly read portion)
  website_id: string; // Hash of the URL (links to ActivityWebsitesVisited)
}

// In-memory tracking of reading progress for each text
// Key: hash of full text, Value: last words read count
const readingProgressTracker = new Map<string, number>();

/**
 * Extract words from text up to a certain count
 */
function extractWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/);
  return words.slice(0, wordCount).join(" ");
}

/**
 * Save user attention data with delta tracking
 * Only saves the newly read portion of text
 */
export async function saveActivityUserAttention(
  sustainedAttention: SustainedAttention,
  url: string
): Promise<void> {
  const { text, wordsRead } = sustainedAttention;

  if (!text || !wordsRead || wordsRead <= 0) {
    return; // Nothing to save
  }

  const db = await getDB();
  const fullTextHash = await hashString(text);

  // Get previous reading progress for this text
  const previousWordsRead = readingProgressTracker.get(fullTextHash) || 0;

  // Calculate delta
  const deltaWords = wordsRead - previousWordsRead;

  if (deltaWords <= 0) {
    return; // No new reading progress
  }

  // Extract only the newly read portion
  const allWordsUpToNow = extractWords(text, wordsRead);
  const previousWords = extractWords(text, previousWordsRead);

  // Get the delta text (new words only)
  const deltaText = allWordsUpToNow.slice(previousWords.length).trim();

  if (!deltaText) {
    return; // No new text to save
  }

  // Hash the delta text for ID
  const deltaHash = await hashString(deltaText);
  const timestamp = Date.now();

  // Hash the URL to create website_id (same hash as ActivityWebsitesVisited)
  const websiteId = await hashString(url);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttention"], "readwrite");
    const store = transaction.objectStore("ActivityUserAttention");

    const record: ActivityUserAttention = {
      id: deltaHash,
      timestamp,
      text_content: deltaText,
      website_id: websiteId,
    };

    const request = store.put(record);

    request.onsuccess = () => {
      // Update progress tracker
      readingProgressTracker.set(fullTextHash, wordsRead);
      console.log(`Saved delta: ${deltaWords} words (${deltaText.substring(0, 50)}...)`);
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
