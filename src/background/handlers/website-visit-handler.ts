/**
 * Website Visit Message Handler
 */

import {
  processWebsiteVisitEvent,
  type WebsiteVisitEvent,
} from "../services/website-visit-tracking-service";
import { getWebsiteVisit, saveWebsiteVisit } from "../../db/models/activity-website-visited";

export async function handleWebsiteVisit(data: WebsiteVisitEvent): Promise<void> {
  if (!data?.url || !data.eventType) {
    return;
  }

  console.log({ websiteVisitEvent: data });

  // Process event using service
  const result = await processWebsiteVisitEvent(data);

  if (!result) {
    return; // Event should be ignored
  }

  // Get existing record if updating
  const existingRecord = await getWebsiteVisit(result.urlHash);

  // Process with existing record context
  const update = await processWebsiteVisitEvent(data, existingRecord);

  if (!update) {
    return;
  }

  // Save to database
  await saveWebsiteVisit(update.record);
}
