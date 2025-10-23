/**
 * Content Script Entry Point
 * Initializes all content script trackers
 */

import { initializeAttentionTracker } from "./attention-tracker";
import { initializeWebsiteVisitTracker } from "./website-visit-tracker";

// Initialize attention tracking
initializeAttentionTracker();

// Initialize website visit tracking
initializeWebsiteVisitTracker();
