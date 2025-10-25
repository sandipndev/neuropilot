/**
 * Pomodoro Start Mutation
 * Starts or resumes the pomodoro timer
 */

import { getOrCreatePomodoroState, savePomodoroState } from "../../db/models/pomodoro";

const FOCUS_DURATION = 1500; // 25 minutes in seconds

export async function startPomodoro(): Promise<void> {
  const state = await getOrCreatePomodoroState();
  
  console.debug('[Pomodoro Start] Current state before start:', state);
  
  // If idle, start a new focus session
  if (state.state === 'idle') {
    state.state = 'focus';
    state.remainingTime = FOCUS_DURATION;
  }
  
  state.isActive = true;
  state.startTime = Date.now();
  state.lastUpdated = Date.now();
  
  await savePomodoroState(state);
  console.debug('[Pomodoro Start] State after start:', state);
}
