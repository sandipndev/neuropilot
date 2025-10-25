/**
 * Pomodoro Reset Mutation
 * Resets the pomodoro timer to idle state
 */

import { getOrCreatePomodoroState, savePomodoroState } from "../../db/models/pomodoro";

const FOCUS_DURATION = 1500; // 25 minutes in seconds

export async function resetPomodoro(): Promise<void> {
  const state = await getOrCreatePomodoroState();
  
  state.isActive = false;
  state.state = 'idle';
  state.remainingTime = FOCUS_DURATION;
  state.startTime = null;
  state.lastUpdated = Date.now();
  
  await savePomodoroState(state);
}
