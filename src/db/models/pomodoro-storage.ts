/**
 * Pomodoro Storage Model
 * Manages pomodoro timer state in localStorage
 */

export interface PomodoroRecord {
  id: string;
  isActive: boolean;
  remainingTime: number; // seconds
  state: 'idle' | 'focus' | 'break';
  startTime: number | null; // timestamp when timer started
  totalPomodoros: number;
  lastUpdated: number;
}

const STORAGE_KEY = "neuropilot_pomodoro";
const POMODORO_ID = "current";

export function getPomodoroState(): PomodoroRecord | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data) as PomodoroRecord;
    return parsed;
  } catch (error) {
    console.error('Error reading pomodoro state from localStorage:', error);
    return null;
  }
}

export function savePomodoroState(state: PomodoroRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving pomodoro state to localStorage:', error);
  }
}

export function getOrCreatePomodoroState(): PomodoroRecord {
  let state = getPomodoroState();
  
  if (!state) {
    state = {
      id: POMODORO_ID,
      isActive: false,
      remainingTime: 1500, // 25 minutes
      state: 'idle',
      startTime: null,
      totalPomodoros: 0,
      lastUpdated: Date.now(),
    };
    savePomodoroState(state);
  }
  
  return state;
}
