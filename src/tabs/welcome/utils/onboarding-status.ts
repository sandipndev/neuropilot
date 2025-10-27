import { getUserName, getUserAge } from '../api/user-data';

/**
 * Check if all onboarding steps are complete by verifying localStorage
 */
export function isOnboardingComplete(): boolean {
  try {
    // Check if user info is saved
    const userName = getUserName();
    const userAge = getUserAge();

    // If both name and age exist, onboarding is complete
    return !!(userName && userAge);
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Get the initial step based on onboarding completion status
 * @returns The step number to start from (0-4)
 */
export function getInitialStep(): number {
  // If onboarding is complete, go directly to completion step (step 4)
  if (isOnboardingComplete()) {
    return 4;
  }

  // Otherwise start from introduction (step 0)
  return 0;
}
