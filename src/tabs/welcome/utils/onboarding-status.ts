import { useStorage } from "@plasmohq/storage/hook";
import { USER_NAME_KEY } from "../api/user-data";


/**
 * Hook to check if all onboarding steps are complete
 * Must be called at the top level of a React component
 */
export function useIsOnboardingComplete(): boolean {
  const [userName] = useStorage(USER_NAME_KEY);

  // If userName exists, onboarding is complete
  return !!userName;
}
