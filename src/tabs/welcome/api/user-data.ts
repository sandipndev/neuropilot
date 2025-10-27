/**
 * Mock API mutations for user name and age management
 * Uses localStorage for persistence
 */

const USER_NAME_KEY = 'neuropilot_user_name';
const USER_AGE_KEY = 'neuropilot_user_age';

interface SetUserNameParams {
  name: string;
  age: number;
}

interface SetUserNameResult {
  success: boolean;
  error?: string;
}

/**
 * Save user name and age to localStorage
 */
export async function setUserName(params: SetUserNameParams): Promise<SetUserNameResult> {
  try {
    const { name, age } = params;
    
    // Validate inputs
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Name is required' };
    }
    
    if (!age || age < 1 || age > 150) {
      return { success: false, error: 'Invalid age' };
    }
    
    // Save to localStorage
    localStorage.setItem(USER_NAME_KEY, name.trim());
    localStorage.setItem(USER_AGE_KEY, age.toString());
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user data:', error);
    return { success: false, error: 'Failed to save user data' };
  }
}

/**
 * Get user name from localStorage
 */
export function getUserName(): string | null {
  try {
    return localStorage.getItem(USER_NAME_KEY);
  } catch (error) {
    console.error('Error getting user name:', error);
    return null;
  }
}

/**
 * Get user age from localStorage
 */
export function getUserAge(): number | null {
  try {
    const age = localStorage.getItem(USER_AGE_KEY);
    return age ? parseInt(age, 10) : null;
  } catch (error) {
    console.error('Error getting user age:', error);
    return null;
  }
}

/**
 * Clear user data from localStorage
 */
export function clearUserData(): void {
  try {
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_AGE_KEY);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}
