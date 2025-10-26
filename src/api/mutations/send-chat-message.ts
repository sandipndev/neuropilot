/**
 * Send Chat Message Mutation
 * Uses Chrome AI (Gemini Nano) for responses and stores messages in IndexedDB
 */

import { sendAIMessage, getCurrentSession, createAISession } from '../../../src/frontend/pages/pinnacle/src/lib/chrome-ai';
import { saveChatMessage } from '../../db/models/chat-messages';

export interface SendChatMessageParams {
  message: string;
  context?: {
    currentFocus?: string;
    recentActivities?: string[];
  };
  onChunk?: (chunk: string, done: boolean) => void;
}

export interface SendChatMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Sends a chat message and streams the assistant's response using Chrome AI
 * Saves both user message and assistant response to IndexedDB
 * @param params - Message, optional context, and streaming callback
 * @returns Promise with the assistant's response
 */
export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<SendChatMessageResponse> {
  // Save user message to IndexedDB
  const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  await saveChatMessage({
    id: userMessageId,
    role: 'user',
    content: params.message,
    timestamp: Date.now(),
  });

  // Get or create AI session
  let session = getCurrentSession();
  if (!session) {
    session = await createAISession({
      systemPrompt: 'You are a helpful AI assistant focused on productivity and focus management. ' +
        'Provide concise, actionable advice to help users stay focused and productive. ' +
        'When given context about their current focus or recent activities, use that information to provide personalized insights.'
    });
  }

  // Create assistant message ID for streaming
  const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  let accumulatedResponse = '';
  
  try {
    // Stream the response
    const fullResponse = await sendAIMessage(session, params.message, {
      currentFocus: params.context?.currentFocus,
      recentActivities: params.context?.recentActivities,
      onChunk: (chunk: string, done: boolean) => {
        // Accumulate chunks for saving
        if (chunk) {
          accumulatedResponse += chunk;
        }
        
        if (params.onChunk) {
          params.onChunk(chunk, done);
        }
        
        // If this is the final chunk, save the complete message
        if (done) {
          const assistantMessage = {
            id: assistantMessageId,
            role: 'assistant' as const,
            content: accumulatedResponse,
            timestamp: Date.now(),
          };
          saveChatMessage(assistantMessage).catch(console.error);
        }
      },
    });

    // Save the complete message if streaming callback wasn't provided
    if (!params.onChunk) {
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: fullResponse,
        timestamp: Date.now(),
      };
      await saveChatMessage(assistantMessage);
    }

    return {
      id: assistantMessageId,
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Save error message if streaming fails
    const errorMessage = `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage);
    
    // Save error as assistant message for user visibility
    const errorResponse = {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: 'Sorry, I encountered an error. Please try again.',
      timestamp: Date.now(),
    };
    
    await saveChatMessage(errorResponse);
    return errorResponse;
  }
}

export { }
