/**
 * Chat Database Operations
 * Helper functions for managing chat messages in IndexedDB
 */

import db from '~/db';
import { createAISession, sendAIMessage, type AILanguageModelSession } from './chrome-ai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

let currentSession: AILanguageModelSession | null = null;

/**
 * Get all chat messages sorted by timestamp
 */
export async function getChatMessages(): Promise<ChatMessage[]> {
  const messages = await db.table('chatMessages')
    .orderBy('timestamp')
    .toArray();
  
  return messages.map(msg => ({
    id: String(msg.id || Date.now()),
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    timestamp: msg.timestamp
  }));
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(message: Omit<ChatMessage, 'id'>): Promise<number> {
  return await db.table('chatMessages').add(message);
}

/**
 * Clear all chat messages
 */
export async function clearChatMessages(): Promise<void> {
  await db.table('chatMessages').clear();
  
  // Destroy current session when clearing messages
  if (currentSession) {
    currentSession.destroy();
    currentSession = null;
  }
}

/**
 * Send a chat message with Chrome AI and stream the response
 */
export async function sendChatMessage(options: {
  message: string;
  context?: {
    currentFocus?: string;
    recentActivities?: string[];
    imageData?: string;
  };
  onChunk?: (chunk: string, done: boolean) => void;
}): Promise<void> {
  const { message, context, onChunk } = options;

  // Save user message
  await saveChatMessage({
    role: 'user',
    content: message,
    timestamp: Date.now()
  });

  try {
    // Create or reuse AI session
    if (!currentSession) {
      currentSession = await createAISession({
        systemPrompt: buildSystemPrompt(context)
      });
    }

    // Send message and get response
    await sendAIMessage(currentSession, message, {
      ...context,
      onChunk
    });

  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    
    // Try to recreate session on error
    if (currentSession) {
      currentSession.destroy();
      currentSession = null;
    }
    
    throw error;
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context?: {
  currentFocus?: string;
  recentActivities?: string[];
  imageData?: string;
}): string {
  let prompt = `You are a helpful AI assistant for a productivity tracking application called Neuropilot. 
You help users understand their focus patterns, provide productivity insights, and offer encouragement.

Be concise, friendly, and actionable in your responses.`;

  if (context?.currentFocus) {
    prompt += `\n\nThe user is currently focused on: ${context.currentFocus}`;
  }

  if (context?.recentActivities && context.recentActivities.length > 0) {
    prompt += `\n\nRecent activities: ${context.recentActivities.join(', ')}`;
  }

  if (context?.imageData) {
    prompt += `\n\nThe user has attached an image for context.`;
  }

  return prompt;
}
