/**
 * Send Chat Message Mutation
 * Uses Chrome AI (Gemini Nano) for responses and stores messages in IndexedDB
 */

import { sendAIMessage, getCurrentSession, createAISession } from '../../../src/frontend/pages/pinnacle/src/lib/chrome-ai';
import { saveChatMessage } from '../../db/models/chat-messages';
import { getChatContext } from '../queries/chat-context';

export interface SendChatMessageParams {
  message: string;
  context?: {
    currentFocus?: string;
    recentActivities?: string[];
    imageData?: string; // Base64 encoded image
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
  const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  await saveChatMessage({
    id: userMessageId,
    role: 'user',
    content: params.message,
    timestamp: Date.now(),
  });

  let session = getCurrentSession();
  if (!session) {
    const systemPrompt = `You are NeuroPilot AI, an intelligent assistant with access to the user's browsing history and activity data.

  CORE PRINCIPLES:
    1. Be concise - Respond in 1-2 lines maximum unless more detail is explicitly requested
    2. Be accurate - Only use information from the provided context
    3. Be honest - If you don't have the information, clearly state it
    4. Be helpful - Provide direct, actionable responses

  RESPONSE GUIDELINES:
    - For questions about past activities: Search the context and provide specific URLs, titles, or content
    - For questions outside the context: Say "I don't have that in your browsing history, but I can help: [brief answer]"
    - For malicious/inappropriate queries: Respond with "I can't assist with that"
    - Always cite sources when referencing specific websites (include URL)
    - Use natural, friendly language

  CONTEXT STRUCTURE:
    - Recent Websites: URLs, titles, and summaries of visited pages
    - Attention Data: Text content the user read/focused on
    - Images: Captions of images the user viewed
    - Current Focus: What the user is currently working on

  FORMAT:
    - Keep responses compact and direct
    - Use bullet points only if listing multiple items
    - Include URLs when referencing specific sites
    - Be conversational but professional`;

    session = await createAISession({
      systemPrompt,
    });
  }

  // Create assistant message ID for streaming
  const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  let accumulatedResponse = '';
  
  try {
    // Check if image is provided
    const hasImage = !!params.context?.imageData;
    
    // Build enriched context for the AI
    const contextParts: string[] = [];
    
    // If image is provided, prioritize it and add special instruction
    // TODO: This needs some work & needs to be fixed  //  cc: @Sandipan
    if (hasImage) {
      contextParts.push(`USER HAS ATTACHED AN IMAGE to their message.
      
      IMPORTANT: Chrome AI's multimodal image support is experimental and may not be fully functional yet. 

      If you can see and analyze the image, please describe it in detail and answer the user's question.

      If you cannot see the image (or receive an empty/invalid image), please respond with:
      "I can see you've attached an image, but I'm unable to analyze it right now as Chrome AI's image support is still experimental. Could you describe what's in the image, or would you like to ask about your browsing history instead?"`);
    }
    
    // Add current focus if available
    if (params.context?.currentFocus) {
      contextParts.push(`CURRENT FOCUS: ${params.context.currentFocus}`);
    }
    
    // Add recent focus areas
    if (params.context?.recentActivities && params.context.recentActivities.length > 0) {
      contextParts.push(`RECENT FOCUS AREAS: ${params.context.recentActivities.join(', ')}`);
    }
    
    // Only fetch RAG context if no image (to reduce token usage)
    if (!hasImage) {
      // Fetch comprehensive RAG context
      const ragContext = await getChatContext(15);
      
      // Add recent websites
      if (ragContext.recentWebsites.length > 0) {
        const websitesContext = ragContext.recentWebsites
          .map((site, i) => `${i + 1}. "${site.title}" (${site.url}) - ${site.summary}`)
          .join('\n');
        contextParts.push(`RECENT WEBSITES:\n${websitesContext}`);
      }
      
      // Add attention data (what user read)
      if (ragContext.recentAttention.length > 0) {
        const attentionContext = ragContext.recentAttention
          .slice(0, 10)
          .map((att) => att.content.substring(0, 150))
          .join(' | ');
        contextParts.push(`CONTENT USER READ: ${attentionContext}`);
      }
      
      // Add image captions
      if (ragContext.recentImages.length > 0) {
        const imagesContext = ragContext.recentImages
          .map((img) => img.caption || img.alt_text)
          .filter(Boolean)
          .join(', ');
        contextParts.push(`IMAGES VIEWED: ${imagesContext}`);
      }
    }
    
    const enrichedContext = contextParts.join('\n\n');
    
    // Stream the response
    const fullResponse = await sendAIMessage(session, params.message, {
      currentFocus: enrichedContext,
      recentActivities: [],
      imageData: params.context?.imageData,
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
