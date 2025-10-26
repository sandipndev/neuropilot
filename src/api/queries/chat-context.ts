/**
 * Chat Context Retrieval for RAG
 * Fetches relevant context from user's browsing history and attention data
 */

import { getActivityUserAttention } from '../../db/models/activity-user-attention';
import { getActivityWebsitesVisited } from '../../db/models/activity-website-visited';
import { getAllImageCaptions } from '../../db/models/image-captions';

export interface ChatContext {
  recentWebsites: Array<{
    url: string;
    title: string;
    summary: string;
    timestamp: number;
  }>;
  recentAttention: Array<{
    content: string;
    timestamp: number;
  }>;
  recentImages: Array<{
    caption: string;
    alt_text: string;
    timestamp: number;
  }>;
  currentFocus?: string;
  recentFocusAreas?: string[];
}

/**
 * Retrieve comprehensive context for RAG chatbot
 * @param limit - Maximum number of items to retrieve per category
 */
export async function getChatContext(limit: number = 20): Promise<ChatContext> {
  try {
    // Fetch all data in parallel
    const [websites, attention, images] = await Promise.all([
      getActivityWebsitesVisited(),
      getActivityUserAttention(),
      getAllImageCaptions(),
    ]);

    // Process and limit websites
    const recentWebsites = websites
      .slice(0, limit)
      .map((site) => ({
        url: site.url,
        title: site.title,
        summary: site.summary,
        timestamp: site.timestamp,
      }));

    // Process and limit attention records
    const recentAttention = attention
      .slice(0, limit * 2) // Get more attention records as they're smaller
      .map((att) => ({
        content: att.text_content,
        timestamp: att.timestamp,
      }));

    // Process and limit images
    const recentImages = images
      .slice(0, limit)
      .map((img) => ({
        caption: img.caption,
        alt_text: img.alt_text,
        timestamp: img.timestamp,
      }));

    return {
      recentWebsites,
      recentAttention,
      recentImages,
    };
  } catch (error) {
    console.error('Error fetching chat context:', error);
    return {
      recentWebsites: [],
      recentAttention: [],
      recentImages: [],
    };
  }
}

/**
 * Search for specific content in user's history
 * @param query - Search query
 * @param limit - Maximum results to return
 */
export async function searchUserHistory(
  query: string,
  limit: number = 10
): Promise<{
  matchedWebsites: Array<{ url: string; title: string; summary: string; relevance: number }>;
  matchedContent: Array<{ content: string; timestamp: number }>;
}> {
  const queryLower = query.toLowerCase();

  try {
    const [websites, attention] = await Promise.all([
      getActivityWebsitesVisited(),
      getActivityUserAttention(),
    ]);

    // Search websites
    const matchedWebsites = websites
      .map((site) => {
        const titleMatch = site.title.toLowerCase().includes(queryLower);
        const urlMatch = site.url.toLowerCase().includes(queryLower);
        const summaryMatch = site.summary.toLowerCase().includes(queryLower);
        
        let relevance = 0;
        if (titleMatch) relevance += 3;
        if (urlMatch) relevance += 2;
        if (summaryMatch) relevance += 1;

        return {
          url: site.url,
          title: site.title,
          summary: site.summary,
          relevance,
        };
      })
      .filter((site) => site.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    // Search attention content
    const matchedContent = attention
      .filter((att) => att.text_content.toLowerCase().includes(queryLower))
      .slice(0, limit)
      .map((att) => ({
        content: att.text_content,
        timestamp: att.timestamp,
      }));

    return {
      matchedWebsites,
      matchedContent,
    };
  } catch (error) {
    console.error('Error searching user history:', error);
    return {
      matchedWebsites: [],
      matchedContent: [],
    };
  }
}
