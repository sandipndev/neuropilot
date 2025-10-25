import type { WinItem } from '../types/wins';

/**
 * Fetch recent wins
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function getWinsData(): Promise<WinItem[]> {
  // Mock data for initial development
  return [
    {
      id: '1',
      focusItem: 'Learning about Figma',
      totalTimeSpent: 7392000, // 2:03:12
      text: 'Completed 2 hours of focused work',
      timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
      type: 'milestone',
    },
    {
      id: '2',
      focusItem: 'Building React components',
      totalTimeSpent: 2700000, // 45 minutes
      text: '7-day focus streak achieved!',
      timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      type: 'streak',
    },
    {
      id: '3',
      focusItem: 'Code review',
      totalTimeSpent: 1200000, // 20 minutes
      text: 'First Pomodoro session completed',
      timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      type: 'achievement',
    },
  ];
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_WINS',
  //   limit: 3
  // });
  // return response.data;
}
