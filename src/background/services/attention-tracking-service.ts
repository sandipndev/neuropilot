/**
 * Attention Tracking Service
 * Handles delta calculation and reading progress tracking
 */

import { hashString } from "../../db/utils/hash";
import { SustainedAttention } from "../tracker/cognitive-attention";

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

export interface AttentionDelta {
  deltaText: string;
  deltaWords: number;
  deltaHash: string;
  websiteId: string;
  timestamp: number;
}

/**
 * Calculate delta text and prepare data for saving
 * Returns null if there's no new reading progress
 */
export async function calculateAttentionDelta(
  sustainedAttention: SustainedAttention,
  url: string
): Promise<AttentionDelta | null> {
  const { text, wordsRead } = sustainedAttention;

  if (!text || !wordsRead || wordsRead <= 0) {
    return null;
  }

  const fullTextHash = await hashString(text);

  // Get previous reading progress for this text
  const previousWordsRead = readingProgressTracker.get(fullTextHash) || 0;

  // Calculate delta
  const deltaWords = wordsRead - previousWordsRead;

  if (deltaWords <= 0) {
    return null; // No new reading progress
  }

  // Extract only the newly read portion
  const allWordsUpToNow = extractWords(text, wordsRead);
  const previousWords = extractWords(text, previousWordsRead);

  // Get the delta text (new words only)
  const deltaText = allWordsUpToNow.slice(previousWords.length).trim();

  if (!deltaText) {
    return null;
  }

  // Hash the delta text for ID
  const deltaHash = await hashString(deltaText);

  // Hash the URL to create website_id
  const websiteId = await hashString(url);

  // Update progress tracker
  readingProgressTracker.set(fullTextHash, wordsRead);

  return {
    deltaText,
    deltaWords,
    deltaHash,
    websiteId,
    timestamp: Date.now(),
  };
}

/**
 * Clear reading progress for a specific text (useful for testing or cleanup)
 */
export function clearReadingProgress(textHash: string): void {
  readingProgressTracker.delete(textHash);
}

/**
 * Clear all reading progress (useful for reset)
 */
export function clearAllReadingProgress(): void {
  readingProgressTracker.clear();
}
