/**
 * Pomodoro timer type definitions
 */

/**
 * Pomodoro timer state
 */
export type PomodoroStateType = 'idle' | 'focus' | 'break';

/**
 * Represents the current state of the Pomodoro timer
 */
export interface PomodoroState {
  isActive: boolean;
  remainingTime: number; // seconds
  state: PomodoroStateType;
  totalPomodoros?: number;
}
