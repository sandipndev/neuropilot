/**
 * Pomodoro Tick Mutation
 * Updates the timer countdown
 */

import { getOrCreatePomodoroState, savePomodoroState } from "../../db/models/pomodoro";

const FOCUS_DURATION = 1500; // 25 minutes in seconds
const BREAK_DURATION = 300; // 5 minutes in seconds

export async function tickPomodoro(): Promise<void> {
  const state = await getOrCreatePomodoroState();
  
  console.debug('[Pomodoro Tick] Current state:', {
    isActive: state.isActive,
    remainingTime: state.remainingTime,
    state: state.state
  });
  
  if (!state.isActive) {
    console.debug('[Pomodoro Tick] Timer not active, skipping');
    return;
  }
  
  state.remainingTime = Math.max(0, state.remainingTime - 1);
  state.lastUpdated = Date.now();
  
  console.debug('[Pomodoro Tick] Updated remainingTime:', state.remainingTime);
  
  // Timer completed
  if (state.remainingTime === 0) {
    if (state.state === 'focus') {
      // Switch to break
      state.state = 'break';
      state.remainingTime = BREAK_DURATION;
      state.totalPomodoros += 1;
      console.debug('[Pomodoro Tick] Switched to break');
    } else if (state.state === 'break') {
      // Switch back to focus
      state.state = 'focus';
      state.remainingTime = FOCUS_DURATION;
      console.debug('[Pomodoro Tick] Switched to focus');
    }
  }
  
  await savePomodoroState(state);
  console.debug('[Pomodoro Tick] State saved');
}
