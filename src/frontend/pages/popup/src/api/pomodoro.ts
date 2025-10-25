import type { PomodoroState } from '../types/pomodoro';

interface PomodoroResponse {
  success: boolean;
  data?: PomodoroState;
  error?: string;
}

/**
 * Fetch current Pomodoro state
 */
export async function getPomodoroState(): Promise<PomodoroState> {
  try {
    const response: PomodoroResponse = await chrome.runtime.sendMessage({
      type: 'GET_POMODORO_STATE'
    });

    console.log('responsexxx18881: ' ,response)

    if (!response || !response.success || !response.data) {
      throw new Error(response?.error || 'Failed to get pomodoro state');
    }

    return response.data;
  } catch (error) {
    console.error('Error getting pomodoro state:', error);
    throw error;
  }
}

/**
 * Start Pomodoro timer
 */
export async function startPomodoro(): Promise<PomodoroState> {
  try {
    const response: PomodoroResponse = await chrome.runtime.sendMessage({
      type: 'START_POMODORO'
    });

    if (!response || !response.success || !response.data) {
      throw new Error(response?.error || 'Failed to start pomodoro');
    }

    return response.data;
  } catch (error) {
    console.error('Error starting pomodoro:', error);
    throw error;
  }
}

/**
 * Stop Pomodoro timer
 */
export async function stopPomodoro(): Promise<PomodoroState> {
  try {
    const response: PomodoroResponse = await chrome.runtime.sendMessage({
      type: 'STOP_POMODORO'
    });

    if (!response || !response.success || !response.data) {
      throw new Error(response?.error || 'Failed to stop pomodoro');
    }

    return response.data;
  } catch (error) {
    console.error('Error stopping pomodoro:', error);
    throw error;
  }
}

/**
 * Reset Pomodoro timer
 */
export async function resetPomodoro(): Promise<PomodoroState> {
  try {
    const response: PomodoroResponse = await chrome.runtime.sendMessage({
      type: 'RESET_POMODORO'
    });

    if (!response || !response.success || !response.data) {
      throw new Error(response?.error || 'Failed to reset pomodoro');
    }

    return response.data;
  } catch (error) {
    console.error('Error resetting pomodoro:', error);
    throw error;
  }
}

/**
 * Toggle Pomodoro timer (start/stop)
 */
export async function togglePomodoro(): Promise<PomodoroState> {
  try {
    const currentState = await getPomodoroState();

    if (currentState.isActive) {
      return await stopPomodoro();
    } else {
      return await startPomodoro();
    }
  } catch (error) {
    console.error('Error toggling pomodoro:', error);
    throw error;
  }
}
