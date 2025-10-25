/**
 * Pomodoro Query
 * Retrieves current pomodoro timer state
 */

import { getOrCreatePomodoroState, type PomodoroRecord } from "../../db/models/pomodoro";

export async function getPomodoroState(): Promise<PomodoroRecord> {
  return await getOrCreatePomodoroState();
}
