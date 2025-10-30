import { useStorage } from "@plasmohq/storage/hook";
import { USER_NAME_KEY } from "../api/user-data";

export const INTRO_STEP_SHOWN_KEY = "introStepShown";

/**
 * Hook to check if all onboarding steps are complete
 * Must be called at the top level of a React component
 */
export function useIsOnboardingComplete(): boolean {
  const [userName] = useStorage(USER_NAME_KEY);

  // If userName exists, onboarding is complete
  return !!userName;
}

/**
 * Hook to get the initial step based on onboarding completion status
 * Must be called at the top level of a React component
 * @returns The step number to start from (0-4)
 */
export function useGetInitialStep(): number {
  const isComplete = useIsOnboardingComplete();
  const [introStepShown] = useStorage(INTRO_STEP_SHOWN_KEY);

  if(introStepShown === undefined) return -1; // a special case..

  // If onboarding is complete, go directly to completion step (step 4)
  if (isComplete) {
    return 4;
  }

  console.log(introStepShown)

  // If intro step (step 0) has been shown, start from step 1
  if (introStepShown) {
    return 1;
  }

  // Otherwise start from introduction (step 0)
  return 0;
}
