/**
 * Get time spent on current tab
 * TODO: Integrate with actual API - replace with chrome.runtime.sendMessage
 */
export async function getCurrentTabTime(): Promise<number> {
  // TODO: Implement actual API call
  return 0;
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_CURRENT_TAB_TIME'
  // });
  // return response.data;
}
