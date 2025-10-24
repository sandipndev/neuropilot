import {
  getActivityWebsitesVisited,
  saveWebsiteVisit,
} from "../../db/models/activity-website-visited";
import { getActivityUserAttentionByWebsite } from "../../db/models/activity-user-attention";
import { getActiveFocus, saveFocus, parseKeywords, parseTimeSpent } from "../../db/models/focus";
import { summarizeWebsiteActivity } from "./ai/website-summarizer";
import { detectFocusArea, summarizeFocus } from "./ai/focus";
import { detectFocusDrift } from "./ai/focus-drift";
import { WebsiteActivityWithAttention } from "../../db/utils/activity";
import { hashString } from "../../db/utils/hash";
import { getFocusData } from "../../api/queries/focus";

type Task = {
  id: string;
  type: string;
  execute: () => Promise<void>;
};

class InferenceScheduler {
  private queue: Task[] = [];
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(intervalMs: number = 30000) {
    console.debug("Starting inference scheduler");

    // Start the continuous processing loop
    this.startProcessingLoop();

    // Schedule initial tasks
    this.scheduleInferenceTasks();

    // Schedule tasks at intervals
    this.intervalId = setInterval(() => {
      this.scheduleInferenceTasks();
    }, intervalMs);
  }

  private scheduleInferenceTasks() {
    console.debug("Scheduling tasks");
    this.addTask({
      id: `schedule-website-summarization-${Date.now()}`,
      type: "schedule-website-summarization",
      execute: async () => {
        await this.scheduleWebsiteSummarization();
      },
    });
    this.addTask({
      id: `schedule-focus-detection-${Date.now()}`,
      type: "schedule-focus-detection",
      execute: async () => {
        await this.scheduleFocusDetection();
      },
    });
    this.addTask({
      id: `log-all-focus-${Date.now()}`,
      type: "log-all-focus",
      execute: async () => {
        await this.logAllFocusRecords();
      },
    });
  }

  stop() {
    console.debug("Stopping inference scheduler");
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async startProcessingLoop() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.debug("Starting continuous processing loop");

    // Continuous loop that processes tasks
    while (this.isRunning) {
      await this.processQueue();

      // Small delay when queue is empty to avoid busy waiting
      if (this.queue.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.debug("Processing loop stopped");
  }

  private async scheduleWebsiteSummarization() {
    console.debug("Scheduling website summarization");
    const websites = await getActivityWebsitesVisited();

    for (const website of websites) {
      const attentionRecords = await getActivityUserAttentionByWebsite(website.id);
      const needsSummary =
        !website.summary || website.summary_attention_count !== attentionRecords.length;

      if (needsSummary && attentionRecords.length > 0) {
        this.addTask({
          id: `summarize-${website.id}`,
          type: "website-summarization",
          execute: async () => {
            const summary = await summarizeWebsiteActivity(website, attentionRecords);
            await saveWebsiteVisit({
              ...website,
              summary,
              summary_attention_count: attentionRecords.length,
            });
          },
        });
      }
    }
  }

  private async scheduleFocusDetection() {
    console.debug("Scheduling focus detection");

    const previousFocus = await getActiveFocus();

    console.log({ previousFocus });

    // Default: assume no drift if no previous focus (so new focus is saved)
    let focusDrifted = false;

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const now = Date.now();
    const since = previousFocus ? previousFocus.last_updated + 1 : now - TEN_MINUTES_MS;

    // === Task 1: Gather recent attention activity ===
    const websites = await getActivityWebsitesVisited();
    const activitySince: WebsiteActivityWithAttention[] = (
      await Promise.all(
        websites.map(async (website) => {
          const all = await getActivityUserAttentionByWebsite(website.id);
          const recent = all.filter((r) => r.timestamp >= since);
          return recent.length > 0
            ? ({ ...website, attentionRecords: recent } as WebsiteActivityWithAttention)
            : null;
        })
      )
    ).filter((x): x is WebsiteActivityWithAttention => Boolean(x));

    // === Task 2: Detect focus drift ===
    if (previousFocus) {
      focusDrifted = await detectFocusDrift(previousFocus, activitySince);
    }

    // === Task 3: Handle no drift (continue or create focus) ===
    if (!focusDrifted) {
      const updatedSlidingWindowFocus = await detectFocusArea(activitySince);
      if (updatedSlidingWindowFocus) {
        const slidingWindowKeywords = previousFocus
          ? parseKeywords(previousFocus)
          : [updatedSlidingWindowFocus];
        const summarizedFocus = await summarizeFocus(slidingWindowKeywords);

        const keywords = previousFocus
          ? [updatedSlidingWindowFocus, ...parseKeywords(previousFocus)]
          : [updatedSlidingWindowFocus];

        // Common fields
        const baseFocus = {
          focus_item: summarizedFocus ?? updatedSlidingWindowFocus,
          keywords: JSON.stringify(keywords),
          last_updated: now,
        };

        // Merge update/insert paths
        const focusData = previousFocus
          ? { ...previousFocus, ...baseFocus }
          : {
              id: await hashString(updatedSlidingWindowFocus.toLowerCase()),
              ...baseFocus,
              time_spent: JSON.stringify([{ start: now, stop: null }]),
            };

        await saveFocus(focusData);
      }
    }

    // === Task 4: Handle drift (close current focus) ===
    else if (previousFocus) {
      const timeSpent = parseTimeSpent(previousFocus);
      const last = timeSpent[timeSpent.length - 1];
      if (last && !last.stop) last.stop = now; // ensure not overriding a closed segment
      await saveFocus({
        ...previousFocus,
        time_spent: JSON.stringify(timeSpent),
        last_updated: now,
      });
    }
  }

  private async logAllFocusRecords() {
    console.debug("Logging all focus records");
    const focusRecords = await getFocusData();
    console.warn({ focusRecords });
  }

  private addTask(task: Task) {
    if (this.queue.some((t) => t.id === task.id)) return;

    this.queue.push(task);
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const task = this.queue.shift();
    if (!task) return;

    try {
      console.debug(`Processing task ${task.id}`);
      await task.execute();
      console.debug(`Task ${task.id} completed`);
    } catch (error) {
      console.error(`Task ${task.id} failed:`, error);
    }
  }
}

export const scheduler = new InferenceScheduler();
