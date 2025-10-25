/**
 * Pomodoro Tick Mutation
 * Updates the timer countdown
 */

import { getOrCreatePomodoroState, savePomodoroState } from "../../db/models/pomodoro";

const FOCUS_DURATION = 20*60; // 20 minutes in seconds
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

  // state.remainingTime = 5

  state.remainingTime = Math.max(0, state.remainingTime - 1);
  state.lastUpdated = Date.now();

  console.debug('[Pomodoro Tick] Updated remainingTime:', state.remainingTime);

  // Timer completed - pause and wait for user to start next phase
  if (state.remainingTime === 0) {
    state.isActive = false; // Pause the timer

    if (state.state === 'focus') {
      // Completed focus, ready for break
      state.state = 'break';
      state.remainingTime = BREAK_DURATION;
      state.totalPomodoros += 1;
      console.debug('[Pomodoro Tick] Focus completed, ready for break');
    } else if (state.state === 'break') {
      // Completed break, ready for focus
      state.state = 'focus';
      state.remainingTime = FOCUS_DURATION;
      console.debug('[Pomodoro Tick] Break completed, ready for focus');
    }
  }

  await savePomodoroState(state);
  console.debug('[Pomodoro Tick] State saved');
}
