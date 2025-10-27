/**
 * Chat Database Operations
 * Helper functions for managing chat messages in IndexedDB
 */

import db from '~/db';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Get all chat messages sorted by timestamp
 */
export async function getChatMessages(): Promise<ChatMessage[]> {
  const messages = await db.chatMessages
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
  return await db.chatMessages.add(message);
}

/**
 * Clear all chat messages
 */
export async function clearChatMessages(): Promise<void> {
  await db.chatMessages.clear();
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
    // Check if Chrome AI is available
    if (!('ai' in window) || !('languageModel' in (window as any).ai)) {
      throw new Error('Chrome AI is not available');
    }

    // Create AI session
    const session = await (window as any).ai.languageModel.create({
      systemPrompt: buildSystemPrompt(context)
    });

    // Build user prompt with context
    let userPrompt = message;
    if (context?.imageData) {
      userPrompt = `[User has attached an image]\n\n${message}`;
    }

    // Stream the response
    const stream = await session.promptStreaming(userPrompt);
    let fullResponse = '';

    for await (const chunk of stream) {
      const newContent = chunk.slice(fullResponse.length);
      fullResponse = chunk;
      
      if (onChunk && newContent) {
        onChunk(newContent, false);
      }
    }

    // Signal completion
    if (onChunk) {
      onChunk('', true);
    }

    // Save assistant message
    await saveChatMessage({
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now()
    });

    // Clean up session
    session.destroy();
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
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
