import { ActivityWebsiteVisited } from "../../db/models/activity-website-visited";
import { ActivityUserAttention } from "../../db/models/activity-user-attention";

export interface WebsiteActivityWithAttention extends ActivityWebsiteVisited {
  attentionRecords: ActivityUserAttention[];
  summary: string;
}
