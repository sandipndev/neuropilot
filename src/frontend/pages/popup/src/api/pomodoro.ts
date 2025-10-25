import type { PomodoroState } from '../types/pomodoro';

/**
 * Fetch current Pomodoro state
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function getPomodoroState(): Promise<PomodoroState> {
  // TODO: Implement actual API call
  return {
    isActive: false,
    remainingTime: 1500, // 25 minutes in seconds
    state: 'idle',
    totalPomodoros: 0,
  };
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_POMODORO_STATE'
  // });
  // return response.data;
}

/**
 * Toggle Pomodoro timer
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function togglePomodoro(): Promise<void> {
  // TODO: Implement actual API call
  console.log('Toggle Pomodoro - TODO: Implement actual API integration');
  
  // TODO: Replace with actual implementation
  // await chrome.runtime.sendMessage({
  //   type: 'TOGGLE_POMODORO'
  // });
}
