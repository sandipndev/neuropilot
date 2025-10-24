/**
 * API Query: Get pulse messages
 */

import { getAllPulses, type Pulse } from "../../db/models/pulse";

/**
 * Get all pulse messages
 */
export async function getPulses(): Promise<Pulse[]> {
  return await getAllPulses();
}
