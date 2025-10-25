/**
 * Pomodoro Timer Service
 * Manages the pomodoro timer countdown in the background
 * 
 * Note: We use a persistent connection approach since Chrome alarms have a 1-minute minimum interval.
 * The timer ticks every second by keeping the service worker alive.
 */

import { tickPomodoro } from "../../api";
import { getPomodoroState } from "../../api";

class PomodoroTimerService {
  private intervalId: NodeJS.Timeout | null = null;
  private port: chrome.runtime.Port | null = null;

  async start() {
    if (this.intervalId !== null) {
      console.warn("Pomodoro timer is already running");
      return;
    }

    console.debug("Starting pomodoro timer service");

    // Create a self-connection to keep the service worker alive
    this.port = chrome.runtime.connect({ name: "pomodoro-keepalive" });

    this.port.onDisconnect.addListener(() => {
      console.debug("Pomodoro keepalive port disconnected, reconnecting...");
      this.port = chrome.runtime.connect({ name: "pomodoro-keepalive" });
    });

    // Start the interval timer
    this.intervalId = setInterval(async () => {
      try {
        const state = await getPomodoroState();
        if (state.isActive) {
          console.debug('[Pomodoro Timer] Ticking...');
          await tickPomodoro();
        }
      } catch (error) {
        console.error("Error in pomodoro tick:", error);
      }
    }, 1000);

    console.debug("Pomodoro timer interval started");
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.debug("Pomodoro timer service stopped");
    }

    if (this.port !== null) {
      this.port.disconnect();
      this.port = null;
    }
  }

  restart() {
    this.stop();
    this.start();
  }
}

export const pomodoroTimer = new PomodoroTimerService();
