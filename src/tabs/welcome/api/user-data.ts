import { Storage } from "@plasmohq/storage"

export const USER_NAME_KEY = "neuropilot_user_name"
export const INTRO_STEP_SHOWN_KEY = "introStepShown";

interface SetUserNameParams {
  name: string
}

interface SetUserNameResult {
  success: boolean
  error?: string
}

const storage = new Storage()

/**
 * Save user name!
 */
export async function setUserName(
  params: SetUserNameParams
): Promise<SetUserNameResult> {
  try {
    const { name } = params

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Name is required" }
    }

    await storage.set(USER_NAME_KEY, name.trim())

    await storage.set("onboarded", true)

    return { success: true }
  } catch (error) {
    console.error("Error saving user data:", error)
    return { success: false, error: "Failed to save user data" }
  }
}

/**
 * Get user name from localStorage
 */
export async function getUserName(): Promise<string | null> {
  try {
    return await storage.get(USER_NAME_KEY)
  } catch (error) {
    console.error("Error getting user name:", error)
    return null
  }
}
