/**
 * Clear Chat Messages Mutation
 * Clears all chat messages from IndexedDB
 */

import { clearAllChatMessages } from '../../db/models/chat-messages';
import { destroyAISession } from '../../../src/frontend/pages/pinnacle/src/lib/chrome-ai';

/**
 * Clears all chat messages from IndexedDB and destroys the AI session
 */
export async function clearChatMessages(): Promise<void> {
  try {
    // Clear messages from IndexedDB
    await clearAllChatMessages();
    
    // Destroy the AI session to start fresh
    destroyAISession();
  } catch (error) {
    throw new Error(
      `Failed to clear chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export {}
