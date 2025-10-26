/**
 * Chrome AI (Gemini Nano) Integration
 * Provides AI chat functionality using Chrome's built-in language model
 */

export interface AILanguageModelSession {
  prompt(input: string): Promise<string>;
  promptStreaming(input: string): AsyncIterable<string>;
  destroy(): void;
}
const MULTIMODAL_EXPECTED_INPUTS = [
  { type: 'text', languages: ['en'] },
  { type: 'image' },
] as const;

const MULTIMODAL_EXPECTED_OUTPUTS = [
  { type: 'text', languages: ['en'] },
] as const;


export interface ChromeAIStatus {
  available: boolean;
  status: string;
  instructions?: string;
}

let currentSession: AILanguageModelSession | null = null;

/**
 * Check if Chrome AI is available
 */
export async function checkChromeAIAvailability(): Promise<ChromeAIStatus> {
  if (typeof window === 'undefined') {
    return {
      available: false,
      status: 'Window object unavailable',
      instructions: 'Run inside a Chrome browser environment',
    };
  }

  const LanguageModel = (window as any).LanguageModel;

  if (!LanguageModel?.availability) {
    return {
      available: false,
      status: 'Chrome LanguageModel not detected',
      instructions: 'Enable these Chrome flags:\n• chrome://flags/#prompt-api-for-gemini-nano\n• chrome://flags/#prompt-api-for-gemini-nano-multimodal-input\n• chrome://flags/#optimization-guide-on-device-model',
    };
  }

  try {
    // Check availability with multimodal options for image support
    const availability = await LanguageModel.availability({
      expectedInputs: MULTIMODAL_EXPECTED_INPUTS,
      expectedOutputs: MULTIMODAL_EXPECTED_OUTPUTS,
    });

    if (availability === 'available') {
      return {
        available: true,
        status: 'Ready',
      };
    }

    if (availability === 'after-download') {
      return {
        available: false,
        status: 'Gemini Nano model is downloading',
        instructions: 'Keep Chrome open until the model download completes, then try again.',
      };
    }

    if (availability === 'no') {
      return {
        available: false,
        status: 'This device does not support the Gemini Nano model',
        instructions: 'Your device hardware may not be compatible with Chrome\'s built-in AI.',
      };
    }

    return {
      available: false,
      status: `Chrome Prompt API not ready (status: ${availability})`,
      instructions: 'Please ensure Chrome AI flags are properly enabled and restart Chrome.',
    };
  } catch (error) {
    return {
      available: false,
      status: 'Error checking availability',
      instructions: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export interface AISessionConfig {
  systemPrompt: string;
  temperature?: number;
  topK?: number;
  enableMultimodal?: boolean;
}


/**
 * Create a new AI session with system prompt
 */
export async function createAISession(config: AISessionConfig): Promise<AILanguageModelSession> {

  const isAvailable = await checkChromeAIAvailability();
  if (!isAvailable.available) {
    return Promise.reject(new Error(isAvailable.instructions || 'Chrome AI not available'));
  }

  const LanguageModel = (window as any).LanguageModel;

  if (!LanguageModel?.availability || !LanguageModel.create) {
    throw new Error('Chrome LanguageModel API not available');
  }

  // Per docs, always pass the same options to availability() that you'll use in create()/prompt()
  const availability = await LanguageModel.availability({
    expectedInputs: MULTIMODAL_EXPECTED_INPUTS,
    expectedOutputs: MULTIMODAL_EXPECTED_OUTPUTS,
  });

  if (availability !== 'available') {
    if (availability === 'after-download') {
      throw new Error('Chrome is downloading the Gemini Nano model. Keep this tab open and try again shortly.');
    }
    if (availability === 'no') {
      throw new Error('This device does not support the Gemini Nano model.');
    }
    throw new Error(`Chrome Prompt API not ready (status: ${availability}).`);
  }

  // Use provided config or defaults
  const sessionConfig: any = {
    initialPrompts: [
      {
        role: 'system',
        content: config?.systemPrompt || 'You are a helpful AI assistant focused on productivity and focus management. Provide concise, actionable advice.',
      }
    ]
  };

  // Add multimodal support if enabled (default: true)
  if (config?.enableMultimodal !== false) {
    sessionConfig.expectedInputs = MULTIMODAL_EXPECTED_INPUTS;
    sessionConfig.expectedOutputs = MULTIMODAL_EXPECTED_OUTPUTS;
  }

  // Only add temperature and topK if both are provided (Chrome AI requirement)
  if (config?.temperature !== undefined && config?.topK !== undefined) {
    sessionConfig.temperature = config.temperature;
    sessionConfig.topK = config.topK;
  }

  const session = await LanguageModel.create(sessionConfig);

  return session;



}

/**
 * Send a message to the AI and get a response (streaming enabled)
 */
export async function sendAIMessage(
  session: AILanguageModelSession,
  message: string,
  context?: {
    currentFocus?: string;
    recentActivities?: string[];
    onChunk?: (chunk: string, done: boolean) => void;
  }
): Promise<string> {
  try {
    let prompt = message;

    if (context) {
      const contextParts: string[] = [];

      if (context.currentFocus) {
        contextParts.push(`Current focus: ${context.currentFocus}`);
      }

      if (context.recentActivities && context.recentActivities.length > 0) {
        contextParts.push(`Recent activities: ${context.recentActivities.join(', ')}`);
      }

      if (contextParts.length > 0) {
        prompt = `Context: ${contextParts.join('. ')}\n\nUser question: ${message}`;
      }
    }

    // Use streaming if callback is provided
    if (context?.onChunk) {
      return await streamAIMessage(session, prompt, context.onChunk);
    }

    // Otherwise use regular prompt
    const response = await session.prompt(prompt);
    return response;
  } catch (error) {
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Stream AI message response chunk by chunk
 */
async function streamAIMessage(
  session: AILanguageModelSession,
  prompt: string,
  onChunk: (chunk: string, done: boolean) => void
): Promise<string> {
  try {
    const stream = session.promptStreaming(prompt);
    let fullResponse = '';
    let previousChunk = '';

    // Process the async iterable stream
    for await (const chunk of stream) {
      // Handle chunk deduplication (Chrome AI sends cumulative chunks)
      const newChunk = chunk.startsWith(previousChunk) 
        ? chunk.slice(previousChunk.length) 
        : chunk;
      
      if (newChunk) {
        fullResponse += newChunk;
        onChunk(newChunk, false);
      }
      
      previousChunk = chunk;
    }

    // Signal completion
    onChunk('', true);
    return fullResponse;
  } catch (error) {
    throw new Error(`Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Destroy the current AI session
 */
export function destroyAISession(session?: AILanguageModelSession): void {
  const sessionToDestroy = session || currentSession;

  if (sessionToDestroy) {
    try {
      sessionToDestroy.destroy();
      if (sessionToDestroy === currentSession) {
        currentSession = null;
      }
    } catch (error) {
      console.error('Error destroying AI session:', error);
    }
  }
}

/**
 * Get the current active session
 */
export function getCurrentSession(): AILanguageModelSession | null {
  return currentSession;
}
