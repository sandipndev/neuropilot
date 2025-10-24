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
  private isProcessing = false;
  private intervalId: number | null = null;

  start(intervalMs: number = 3000) {
    console.log("Starting inference scheduler");
    this.intervalId = setInterval(() => {
      console.log("Scheduling tasks");
      this.scheduleWebsiteSummarization();
      this.scheduleFocusDetection();
    }, intervalMs);

    this.scheduleWebsiteSummarization();
    this.scheduleFocusDetection();
  }

  stop() {
    console.log("Stopping inference scheduler");
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async scheduleWebsiteSummarization() {
    console.log("Scheduling website summarization");
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
    console.log("Scheduling focus detection");
    const websites = await getActivityWebsitesVisited();

    const combinedActivity: WebsiteActivityWithAttention[] = await Promise.all(
      websites.map(async (website) => ({
        ...website,
        attentionRecords: await getActivityUserAttentionByWebsite(website.id),
      }))
    );

    const focusArea = await detectFocusArea(combinedActivity);
    console.log({ focusArea });
  }

  private addTask(task: Task) {
    if (this.queue.some((t) => t.id === task.id)) return;

    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      try {
        await task.execute();
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
      }
    }

    this.isProcessing = false;
  }
}

export const scheduler = new InferenceScheduler();
