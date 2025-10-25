import type { FocusData, FocusHistoryItem } from '../types/focus';

/**
 * Fetch current focus data
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function getCurrentFocusData(): Promise<FocusData | null> {
  // Hardcoded for initial development
  return {
    id: '1',
    focusItem: "Learning about Figma",
    totalFocusTime: 7392000, // 2:03:12 in milliseconds
    keywords: ["Figma", "design", "UI"],
    timeSpent: [
      {
        start: Date.now() - 7392000,
        stop: Date.now(),
      },
    ],
    isActive: true,
    lastUpdated: Date.now(),
  };
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_CURRENT_FOCUS'
  // });
  // return response.data;
}

/**
 * Fetch last 5 focus items
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function getFocusHistory(): Promise<FocusHistoryItem[]> {
  // Mock data for initial development
  return [
    {
      id: '1',
      focusItem: 'Reading laws in French Colonies',
      timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
      duration: 1000 * 60 * 45, // 45 minutes
      keywords: ['law', 'history'],
    },
    {
      id: '2',
      focusItem: 'Historic Judicial Systems in Chandannagar',
      timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      duration: 1000 * 60 * 30, // 30 minutes
      keywords: ['history', 'judicial'],
    },
    {
      id: '3',
      focusItem: 'You were reading about XYZ',
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      duration: 1000 * 60 * 20, // 20 minutes
      keywords: ['reading'],
    },
  ];
}
