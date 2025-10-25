/**
 * Pomodoro Model
 * Manages pomodoro timer state in IndexedDB
 */

import { getDB } from "../index";

export interface PomodoroRecord {
  id: string;
  isActive: boolean;
  remainingTime: number; // seconds
  state: 'idle' | 'focus' | 'break';
  startTime: number | null; // timestamp when timer started
  totalPomodoros: number;
  lastUpdated: number;
}

const STORE_NAME = "Pomodoro";
const POMODORO_ID = "current";

export async function getPomodoroState(): Promise<PomodoroRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(POMODORO_ID);

    request.onsuccess = () => {
      const result = request.result as PomodoroRecord | undefined;
      resolve(result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function savePomodoroState(state: PomodoroRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(state);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOrCreatePomodoroState(): Promise<PomodoroRecord> {
  let state = await getPomodoroState();
  
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
    await savePomodoroState(state);
  }
  
  return state;
}
