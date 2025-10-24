import {
  getActivityWebsitesVisited,
  saveWebsiteVisit,
} from "../../db/models/activity-website-visited";
import { getActivityUserAttentionByWebsite } from "../../db/models/activity-user-attention";
import { summarizeWebsiteActivity } from "./ai/website-summarizer";
import { detectFocusArea } from "./ai/focus";
import { WebsiteActivityWithAttention } from "../../db/utils/activity";

type Task = {
  id: string;
  type: string;
  execute: () => Promise<void>;
};

class InferenceScheduler {
  private queue: Task[] = [];
  private isRunning = false;
  private intervalId: number | null = null;

  start(intervalMs: number = 3000) {
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
    const websites = await getActivityWebsitesVisited();

    const combinedActivity: WebsiteActivityWithAttention[] = await Promise.all(
      websites.map(async (website) => ({
        ...website,
        attentionRecords: await getActivityUserAttentionByWebsite(website.id),
      }))
    );

    const focusArea = await detectFocusArea(combinedActivity);
    console.debug({ focusArea });
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
