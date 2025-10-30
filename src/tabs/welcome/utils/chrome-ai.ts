/**
 * Utility functions for Chrome AI availability checking
 */

// Type definitions for Chrome AI APIs
interface ChromeAIAPI {
  availability?: () => Promise<string>
}

interface WindowWithChromeAI extends Window {
  LanguageModel?: ChromeAIAPI
  Writer?: ChromeAIAPI
  Rewriter?: ChromeAIAPI
  Proofreader?: ChromeAIAPI
  Translator?: ChromeAIAPI
}

/**
 * Check if Chrome AI flags are properly enabled
 * This checks if LanguageModel.availability exists, which indicates flags are set correctly
 *
 * @returns Object containing flags status
 */
export async function checkChromeAIAvailability(): Promise<{
  available: boolean
  reason?: string
}> {
  const LanguageModel = (window as WindowWithChromeAI).LanguageModel
  if (!LanguageModel?.availability) {
    return {
      available: false,
      reason:
        "Chrome flags are not enabled. Please enable the required flags and restart Chrome."
    }
  }

  const Writer = (window as WindowWithChromeAI).Writer
  if (!Writer?.availability) {
    return {
      available: false,
      reason:
        "Writer flags are not enabled. Please enable the required flags and restart Chrome."
    }
  }

  const Rewriter = (window as WindowWithChromeAI).Rewriter
  if (!Rewriter?.availability) {
    return {
      available: false,
      reason:
        "Rewriter flags are not enabled. Please enable the required flags and restart Chrome."
    }
  }

  const Proofreader = (window as WindowWithChromeAI).Proofreader
  if (!Proofreader?.availability) {
    return {
      available: false,
      reason:
        "Proofreader flags are not enabled. Please enable the required flags and restart Chrome."
    }
  }

  const Translator = (window as WindowWithChromeAI).Translator
  if (!Translator?.availability) {
    return {
      available: false,
      reason:
        "Translator flags are not enabled. Please enable the required flags and restart Chrome."
    }
  }

  return {
    available: true
  }
}

/**
 * Check if the Gemini Nano model is available and ready to use
 *
 * @returns Object containing model availability status
 */
export async function checkModelAvailability(): Promise<{
  status: "readily" | "after-download" | "no"
  available: boolean
  needsDownload: boolean
  message: string
}> {
  // First check if Chrome AI flags are enabled
  const chromeAICheck = await checkChromeAIAvailability()

  if (!chromeAICheck.available) {
    return {
      status: "no",
      available: false,
      needsDownload: false,
      message: chromeAICheck.reason || "Chrome flags are not enabled"
    }
  }

  try {
    const LanguageModel = (window as WindowWithChromeAI).LanguageModel

    // Check model availability status
    const status = await LanguageModel.availability()

    // Handle both 'readily' and 'available' as ready states
    if (status === "readily" || status === "available") {
      return {
        status: "readily",
        available: true,
        needsDownload: false,
        message: "Gemini Nano model is ready to use"
      }
    }

    if (status === "after-download" || status === "downloadable") {
      return {
        status: "after-download",
        available: false,
        needsDownload: true,
        message: "Gemini Nano model needs to be downloaded"
      }
    }

    if (status === "no") {
      return {
        status: "no",
        available: false,
        needsDownload: false,
        message: "Gemini Nano model is not available on this device"
      }
    }

    // Unknown status - log it for debugging
    console.warn("Unknown model availability status:", status)
    return {
      status: "no",
      available: false,
      needsDownload: false,
      message: `Unknown model availability status: ${status}`
    }
  } catch (error) {
    return {
      status: "no",
      available: false,
      needsDownload: false,
      message: `Error checking model availability: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}
