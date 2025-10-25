import {
  getActivityWebsitesVisited,
  saveWebsiteVisit,
} from "../../db/models/activity-website-visited";
import { getActivityUserAttentionByWebsite } from "../../db/models/activity-user-attention";
import { getActiveFocus, saveFocus, parseKeywords, parseTimeSpent } from "../../db/models/focus";
import { summarizeWebsiteActivity } from "./ai/website-summarizer";
import { detectFocusArea, summarizeFocus } from "./ai/focus";
import { detectFocusDrift } from "./ai/focus-drift";
import { generatePulse } from "./ai/pulse";
import { generateQuizQuestions } from "./ai/quiz-questions";
import { generateActivitySummary } from "./ai/activity-summary";
import { generateWins } from "./ai/wins";
import { WebsiteActivityWithAttention } from "../../db/utils/activity";
import { hashString } from "../../db/utils/hash";
import { getFocusData } from "../../api/queries/focus";
import { savePulses } from "../../db/models/pulse";
import { saveQuizQuestions } from "../../db/models/quiz-questions";
import { saveActivitySummary, deleteOldActivitySummaries } from "../../db/models/activity-summary";
import { getPulses } from "../../api/queries/pulse";
import { getQuizQuestions } from "../../api/queries/quiz-questions";
import { getActivitySummaries } from "../../api/queries/activity-summary";
import { getWins } from "../../api/queries/wins";
import { getCachedActivityUserAttentionImageCaptions } from "../../api/queries/image-captions";
import { deleteImageCaption } from "../../db/models/image-captions";
import { getActivityUserAttention } from "../../db/models/activity-user-attention";

type Task = {
  id: string;
  type: string;
  execute: () => Promise<void>;
};

class InferenceScheduler {
  private queue: Task[] = [];
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private activitySummaryIntervalId: ReturnType<typeof setInterval> | null = null;

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

    // Schedule activity summary generation every 1 minute
    this.scheduleActivitySummaryGeneration(); // Initial run
    this.activitySummaryIntervalId = setInterval(() => {
      this.scheduleActivitySummaryGeneration();
    }, 60000); // 1 minute
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
      id: `schedule-pulse-generation-${Date.now()}`,
      type: "schedule-pulse-generation",
      execute: async () => {
        await this.schedulePulseGeneration();
      },
    });
    this.addTask({
      id: `schedule-quiz-generation-${Date.now()}`,
      type: "schedule-quiz-generation",
      execute: async () => {
        await this.scheduleQuizGeneration();
      },
    });
    this.addTask({
      id: `schedule-wins-generation-${Date.now()}`,
      type: "schedule-wins-generation",
      execute: async () => {
        await this.scheduleWinsGeneration();
      },
    });
    this.addTask({
      id: `schedule-image-caption-cleanup-${Date.now()}`,
      type: "schedule-image-caption-cleanup",
      execute: async () => {
        await this.scheduleImageCaptionCleanup();
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
    if (this.activitySummaryIntervalId) {
      clearInterval(this.activitySummaryIntervalId);
      this.activitySummaryIntervalId = null;
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
    const allImageCaptions = await getCachedActivityUserAttentionImageCaptions();

    for (const website of websites) {
      const attentionRecords = await getActivityUserAttentionByWebsite(website.id);
      const needsSummary =
        !website.summary || website.summary_attention_count !== attentionRecords.length;

      if (needsSummary && attentionRecords.length > 0) {
        this.addTask({
          id: `summarize-${website.id}`,
          type: "website-summarization",
          execute: async () => {
            const websiteImageCaptions = allImageCaptions.filter(
              (img) =>
                img.image_src.startsWith(website.url) ||
                img.image_src.includes(new URL(website.url).hostname)
            );
            const summary = await summarizeWebsiteActivity(
              website,
              attentionRecords,
              websiteImageCaptions
            );
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

    console.debug({ previousFocus });

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

    const allImageCaptions = await getCachedActivityUserAttentionImageCaptions();
    const recentImageCaptions = allImageCaptions.filter((img) => img.timestamp >= since);

    // === Task 2: Detect focus drift ===
    if (previousFocus) {
      focusDrifted = await detectFocusDrift(previousFocus, activitySince, recentImageCaptions);
    }

    // === Task 3: Handle no drift (continue or create focus) ===
    if (!focusDrifted) {
      const updatedSlidingWindowFocus = await detectFocusArea(activitySince, recentImageCaptions);
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

  private async schedulePulseGeneration() {
    console.debug("Scheduling pulse generation");

    // Get focus data
    const focusRecords = await getFocusData();

    // Get recent website activity with attention
    const websites = await getActivityWebsitesVisited();
    const recentWebsites: WebsiteActivityWithAttention[] = (
      await Promise.all(
        websites.map(async (website) => {
          const attentionRecords = await getActivityUserAttentionByWebsite(website.id);
          return attentionRecords.length > 0
            ? ({ ...website, attentionRecords } as WebsiteActivityWithAttention)
            : null;
        })
      )
    ).filter((x): x is WebsiteActivityWithAttention => Boolean(x));

    const allImageCaptions = await getCachedActivityUserAttentionImageCaptions();
    const recentImageCaptions = allImageCaptions.slice(0, 10);

    // Only generate pulse if there's data to work with
    if (focusRecords.length > 0 || recentWebsites.length > 0) {
      const pulseMessages = await generatePulse({
        focusRecords,
        recentWebsites,
        imageAttention: recentImageCaptions,
      });

      await savePulses(pulseMessages);
      console.debug("Pulse generated and saved", { pulseMessages });
    } else {
      console.debug("No data available for pulse generation");
    }
  }

  private async scheduleQuizGeneration() {
    console.debug("Scheduling quiz generation");

    // Get focus data
    const focusRecords = await getFocusData();

    // Get recent website activity with attention
    const websites = await getActivityWebsitesVisited();
    const recentWebsites: WebsiteActivityWithAttention[] = (
      await Promise.all(
        websites.map(async (website) => {
          const attentionRecords = await getActivityUserAttentionByWebsite(website.id);
          return attentionRecords.length > 0
            ? ({ ...website, attentionRecords } as WebsiteActivityWithAttention)
            : null;
        })
      )
    ).filter((x): x is WebsiteActivityWithAttention => Boolean(x));

    const allImageCaptions = await getCachedActivityUserAttentionImageCaptions();
    const recentImageCaptions = allImageCaptions.slice(0, 10);

    // Only generate quiz if there's data to work with
    if (focusRecords.length > 0 || recentWebsites.length > 0) {
      const quizQuestions = await generateQuizQuestions({
        focusRecords,
        recentWebsites,
        imageAttention: recentImageCaptions,
      });

      await saveQuizQuestions(quizQuestions);
      console.debug("Quiz questions generated and saved", { quizQuestions });
    } else {
      console.debug("No data available for quiz generation");
    }
  }

  private async scheduleWinsGeneration() {
    console.debug("Scheduling wins generation");

    // Generate wins from top focus items (clears and saves top 3)
    const result = await generateWins();

    console.debug("Wins generation completed", {
      winsCount: result.wins.length,
      updated: result.updated,
    });
  }

  private async scheduleImageCaptionCleanup() {
    console.debug("Scheduling image caption cleanup");
    const captions = await getCachedActivityUserAttentionImageCaptions();

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const caption of captions) {
      const age = now - caption.timestamp;
      if (age > SEVEN_DAYS_MS) {
        await deleteImageCaption(caption.image_src);
        console.debug(`Deleted old image caption: ${caption.image_src}`);
      }
    }
  }

  private async logAllFocusRecords() {
    console.debug("Logging all focus records");
    const focusRecords = await getFocusData();
    const pulses = await getPulses();
    const quizQuestions = await getQuizQuestions();
    const activitySummaries = await getActivitySummaries();
    const wins = await getWins();

    console.info({ pulses, focusRecords, quizQuestions, activitySummaries, wins });
  }

  private async scheduleActivitySummaryGeneration() {
    console.debug("Scheduling activity summary generation");

    const ONE_MINUTE_MS = 60 * 1000;
    const now = Date.now();
    const since = now - ONE_MINUTE_MS;

    // Get all websites visited in the last minute
    const websites = await getActivityWebsitesVisited();
    const recentWebsites: WebsiteActivityWithAttention[] = (
      await Promise.all(
        websites.map(async (website) => {
          const attentionRecords = await getActivityUserAttentionByWebsite(website.id);
          const recentAttention = attentionRecords.filter((r) => r.timestamp >= since);
          return recentAttention.length > 0
            ? ({ ...website, attentionRecords: recentAttention } as WebsiteActivityWithAttention)
            : null;
        })
      )
    ).filter((x): x is WebsiteActivityWithAttention => Boolean(x));

    // Get all attention records from the last minute
    const allAttention = await getActivityUserAttention();
    const recentAttention = allAttention
      .filter((a) => a.timestamp >= since)
      .map((a) => a.text_content);

    // Get image captions from the last minute
    const allImageCaptions = await getCachedActivityUserAttentionImageCaptions();
    const recentImageCaptions = allImageCaptions.filter((img) => img.timestamp >= since);

    // Only generate summary if there's activity
    if (recentWebsites.length > 0 || recentAttention.length > 0 || recentImageCaptions.length > 0) {
      this.addTask({
        id: `activity-summary-${Date.now()}`,
        type: "activity-summary-generation",
        execute: async () => {
          const summary = await generateActivitySummary({
            recentWebsites,
            recentAttention,
            imageAttention: recentImageCaptions,
          });

          await saveActivitySummary(summary);
          console.debug("Activity summary generated and saved", { summary });
        },
      });
    } else {
      console.debug("No activity in the last minute to summarize");
    }

    // Clean up old activity summaries (older than 7 days)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const cutoffTime = now - SEVEN_DAYS_MS;
    await deleteOldActivitySummaries(cutoffTime);
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
