/**
 * Utility functions for Chrome AI availability checking
 */

/**
 * Check if Chrome AI API is available in the browser
 * This verifies that the required Chrome flags are enabled
 * 
 * @returns Object containing availability status and details
 */
export async function checkChromeAIAvailability(): Promise<{
  available: boolean;
  reason?: string;
}> {
  // Check if window.ai exists
  if (!window.ai) {
    return {
      available: false,
      reason: 'Chrome AI API not found. Please ensure you are using Chrome 127+ and have enabled the required flags.',
    };
  }

  // Check if languageModel API exists
  if (!window.ai.languageModel) {
    return {
      available: false,
      reason: 'Language Model API not found. Please enable the required Chrome flags.',
    };
  }

  return {
    available: true,
  };
}

/**
 * Check if the Gemini Nano model is available and ready to use
 * 
 * @returns Object containing model availability status
 */
export async function checkModelAvailability(): Promise<{
  status: 'readily' | 'after-download' | 'no';
  available: boolean;
  needsDownload: boolean;
  message: string;
}> {
  // First check if Chrome AI is available
  const chromeAICheck = await checkChromeAIAvailability();
  
  if (!chromeAICheck.available) {
    return {
      status: 'no',
      available: false,
      needsDownload: false,
      message: chromeAICheck.reason || 'Chrome AI is not available',
    };
  }

  try {
    // Check model availability status
    const status = await window.ai!.languageModel.availability();

    switch (status) {
      case 'readily':
        return {
          status: 'readily',
          available: true,
          needsDownload: false,
          message: 'Gemini Nano model is ready to use',
        };

      case 'after-download':
        return {
          status: 'after-download',
          available: false,
          needsDownload: true,
          message: 'Gemini Nano model needs to be downloaded',
        };

      case 'no':
        return {
          status: 'no',
          available: false,
          needsDownload: false,
          message: 'Gemini Nano model is not available on this device',
        };

      default:
        return {
          status: 'no',
          available: false,
          needsDownload: false,
          message: 'Unknown model availability status',
        };
    }
  } catch (error) {
    return {
      status: 'no',
      available: false,
      needsDownload: false,
      message: `Error checking model availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
