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
}

export interface SendChatMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  timestamp: number;
}

/**
 * Sends a chat message and returns the assistant's response using Chrome AI
 * Also saves both user message and assistant response to IndexedDB
 * @param params - Message and optional context
 * @returns Promise with the assistant's response
 */
export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<SendChatMessageResponse> {
  try {
    // Save user message to IndexedDB
    const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    await saveChatMessage({
      id: userMessageId,
      role: 'user',
      content: params.message,
      timestamp: Date.now(),
    });

    console.log(`saved..`)

    // Get or create AI session
    let session = getCurrentSession();


    if (!session) {
      session = await createAISession(
        {
          systemPrompt: 'You are a helpful AI assistant focused on productivity and focus management. ' +
            'Provide concise, actionable advice to help users stay focused and productive. ' +
            'When given context about their current focus or recent activities, use that information to provide personalized insights.'
        }
      );
    }
    console.log(session)

    // Send message with context
    const response = await sendAIMessage(session, params.message, params.context);

    // Save assistant response to IndexedDB
    const assistantMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      role: 'assistant' as const,
      content: response,
      timestamp: Date.now(),
    };

    await saveChatMessage(assistantMessage);

    return assistantMessage;
  } catch (error) {
    throw new Error(
      `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export { }
