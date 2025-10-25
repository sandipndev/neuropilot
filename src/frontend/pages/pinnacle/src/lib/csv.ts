// CSV generation utilities

import type { FocusWithParsedData, WinWithParsedData } from '../types';

/**
 * Escape CSV cell content to handle commas, quotes, and newlines
 * @param cell - Cell content to escape
 * @returns Escaped cell content
 */
function escapeCSVCell(cell: string | number): string {
  const stringValue = String(cell);
  
  // If the cell contains comma, quote, or newline, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape existing quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Generate CSV content from focus history and wins data
 * @param focusHistory - Array of focus sessions
 * @param wins - Array of wins
 * @returns CSV string content
 */
export function generateCSV(
  focusHistory: FocusWithParsedData[],
  wins: WinWithParsedData[]
): string {
  const headers = ['Date', 'Focus Item', 'Time Spent (hours)', 'Keywords', 'Type'];
  const rows: string[][] = [];

  // Add focus history rows
  focusHistory.forEach((focus) => {
    rows.push([
      new Date(focus.last_updated).toISOString(),
      focus.focus_item,
      (focus.total_time / (1000 * 60 * 60)).toFixed(2),
      focus.keywords.join('; '),
      'Focus Session',
    ]);
  });

  // Add wins rows
  wins.forEach((win) => {
    rows.push([
      new Date(win.recorded_at).toISOString(),
      win.focus_item,
      win.time_spent_hours.toString(),
      win.keywords.join('; '),
      'Win',
    ]);
  });

  // Convert to CSV string
  const csvContent = [
    headers.map(escapeCSVCell).join(','),
    ...rows.map((row) => row.map(escapeCSVCell).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Trigger browser download of CSV file
 * @param content - CSV content string
 * @param filename - Name for the downloaded file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename for CSV export with current date
 * @returns Filename string like "pinnacle-export-2025-01-15.csv"
 */
export function generateCSVFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `pinnacle-export-${year}-${month}-${day}.csv`;
}
