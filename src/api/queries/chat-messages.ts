/**
 * Get Chat Messages Query
 * Retrieves chat message history from IndexedDB
 */

import { getAllChatMessages } from '../../db/models/chat-messages';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Retrieves chat message history from IndexedDB
 * @returns Promise with array of chat messages ordered by timestamp
 */
export async function getChatMessages(): Promise<ChatMessage[]> {
  try {
    const messages = await getAllChatMessages();
    return messages;
  } catch (error) {
    console.error('Error retrieving chat messages:', error);
    throw new Error(
      `Failed to retrieve chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export {}
