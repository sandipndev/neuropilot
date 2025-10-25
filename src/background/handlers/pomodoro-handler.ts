/**
 * Pomodoro Handler
 * Handles pomodoro-related messages from the frontend
 */

import {
  getPomodoroState,
  startPomodoro,
  stopPomodoro,
  resetPomodoro,
  tickPomodoro,
} from "../../api";

export async function handleGetPomodoroState() {
  try {
    const state = await getPomodoroState();
    return { success: true, data: state };
  } catch (error) {
    console.error("Error getting pomodoro state:", error);
    return { success: false, error: String(error) };
  }
}

export async function handleStartPomodoro() {
  try {
    await startPomodoro();
    const state = await getPomodoroState();
    return { success: true, data: state };
  } catch (error) {
    console.error("Error starting pomodoro:", error);
    return { success: false, error: String(error) };
  }
}

export async function handleStopPomodoro() {
  try {
    await stopPomodoro();
    const state = await getPomodoroState();
    return { success: true, data: state };
  } catch (error) {
    console.error("Error stopping pomodoro:", error);
    return { success: false, error: String(error) };
  }
}

export async function handleResetPomodoro() {
  try {
    await resetPomodoro();
    const state = await getPomodoroState();
    return { success: true, data: state };
  } catch (error) {
    console.error("Error resetting pomodoro:", error);
    return { success: false, error: String(error) };
  }
}

export async function handleTickPomodoro() {
  try {
    await tickPomodoro();
    const state = await getPomodoroState();
    return { success: true, data: state };
  } catch (error) {
    console.error("Error ticking pomodoro:", error);
    return { success: false, error: String(error) };
  }
}
