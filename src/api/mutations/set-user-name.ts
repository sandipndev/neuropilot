/**
 * Mutation to save user information to localStorage
 */

const STORAGE_KEY_NAME = 'neuropilot:userName';
const STORAGE_KEY_AGE = 'neuropilot:userAge';

export interface SetUserInfoParams {
  name: string;
  age: number;
}

export interface SetUserInfoResult {
  success: boolean;
  error?: string;
}

/**
 * Save user information to localStorage
 * @param params - Object containing the user's name and age
 * @returns Promise resolving to success status
 */
export async function setUserName(params: SetUserInfoParams): Promise<SetUserInfoResult> {
  try {
    const { name, age } = params;

    // Validate name
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Name is required',
      };
    }

    // Validate age
    if (!age || age < 1 || age > 150) {
      return {
        success: false,
        error: 'Please enter a valid age',
      };
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
    localStorage.setItem(STORAGE_KEY_AGE, age.toString());

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error saving user information:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save user information',
    };
  }
}

/**
 * Get user name from localStorage
 * @returns The stored user name or null if not found
 */
export function getUserName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_NAME);
  } catch (error) {
    console.error('Error retrieving user name:', error);
    return null;
  }
}

/**
 * Get user age from localStorage
 * @returns The stored user age or null if not found
 */
export function getUserAge(): number | null {
  try {
    const age = localStorage.getItem(STORAGE_KEY_AGE);
    return age ? parseInt(age, 10) : null;
  } catch (error) {
    console.error('Error retrieving user age:', error);
    return null;
  }
}
