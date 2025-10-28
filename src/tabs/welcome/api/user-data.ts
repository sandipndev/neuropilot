/**
 * Mock API mutations for user name and age management
 * Uses localStorage for persistence
 */

import { Storage } from "@plasmohq/storage"

export const USER_NAME_KEY = "neuropilot_user_name"
export const USER_AGE_KEY = "neuropilot_user_age"

interface SetUserNameParams {
  name: string
  age: number
}

interface SetUserNameResult {
  success: boolean
  error?: string
}

const storage = new Storage()

/**
 * Save user name and age to localStorage
 */
export async function setUserName(
  params: SetUserNameParams
): Promise<SetUserNameResult> {
  try {
    const { name, age } = params

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Name is required" }
    }

    if (!age || age < 1 || age > 150) {
      return { success: false, error: "Invalid age" }
    }

    await storage.set(USER_NAME_KEY, name.trim())
    await storage.set(USER_AGE_KEY, age.toString())

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

/**
 * Get user age from localStorage
 */
export async function getUserAge(): Promise<number | null> {
  try {
    const age = localStorage.getItem(USER_AGE_KEY)
    return age ? parseInt(age, 10) : null
  } catch (error) {
    console.error("Error getting user age:", error)
    return null
  }
}

/**
 * Clear user data from localStorage
 */
export function clearUserData(): void {
  try {
    localStorage.removeItem(USER_NAME_KEY)
    localStorage.removeItem(USER_AGE_KEY)
  } catch (error) {
    console.error("Error clearing user data:", error)
  }
}
