/**
 * Type definitions for Chrome AI API (Gemini Nano)
 * Requires Chrome 127+ with appropriate flags enabled
 */

export interface AILanguageModel {
  /**
   * Check if the language model is available
   * @returns 'readily' - Model is ready to use
   *          'after-download' - Model needs to be downloaded
   *          'no' - Model is not available
   */
  availability(): Promise<'readily' | 'after-download' | 'no'>;

  /**
   * Create a new language model session
   * @param options Configuration options including download monitor
   */
  create(options?: {
    monitor?: (monitor: AIModelMonitor) => void;
  }): Promise<AILanguageModelSession>;
}

export interface AIModelMonitor extends EventTarget {
  /**
   * Listen for download progress events
   */
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
}

export interface DownloadProgressEvent extends Event {
  /**
   * Number of bytes downloaded
   */
  loaded: number;
  
  /**
   * Total number of bytes to download
   */
  total: number;
}

export interface AILanguageModelSession {
  /**
   * Send a prompt to the language model
   * @param input The prompt text
   * @returns The model's response
   */
  prompt(input: string): Promise<string>;

  /**
   * Destroy the session and free resources
   */
  destroy(): void;
}

declare global {
  interface Window {
    ai?: {
      languageModel: AILanguageModel;
    };
  }
}
