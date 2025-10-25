/**
 * Chat Messages Model
 * Handles storage and retrieval of chat messages
 */

import { getDB } from '../index';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORE_NAME = 'ChatMessages';

/**
 * Save a chat message to IndexedDB
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(message);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save chat message'));
  });
}

/**
 * Get all chat messages ordered by timestamp
 */
export async function getAllChatMessages(): Promise<ChatMessage[]> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor();
    
    const messages: ChatMessage[] = [];
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        messages.push(cursor.value);
        cursor.continue();
      } else {
        resolve(messages);
      }
    };
    
    request.onerror = () => reject(new Error('Failed to retrieve chat messages'));
  });
}

/**
 * Clear all chat messages
 */
export async function clearAllChatMessages(): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear chat messages'));
  });
}

/**
 * Delete a specific chat message
 */
export async function deleteChatMessage(id: string): Promise<void> {
  const db = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete chat message'));
  });
}
