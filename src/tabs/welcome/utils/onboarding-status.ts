import { useStorage } from "@plasmohq/storage/hook";
import { USER_NAME_KEY } from "../api/user-data";

/**
 * Check if all onboarding steps are complete by verifying localStorage
 */
export function useIsOnboardingComplete(): boolean {
  try {
    const [userName, _] = useStorage(USER_NAME_KEY);

    // If both name and age exist, onboarding is complete
    return !!(userName);
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Get the initial step based on onboarding completion status
 * @returns The step number to start from (0-4)
 */
export function useGetInitialStep(): number {
  // If onboarding is complete, go directly to completion step (step 4)
  if (useIsOnboardingComplete()) {
    return 4;
  }

  // Otherwise start from introduction (step 0)
  return 0;
}
