/**
 * ChatMessage Component
 * Displays individual chat messages with visual distinction between user and assistant
 */

import { motion } from 'framer-motion';
import { formatRelativeTime } from '../lib/time';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType & { isStreaming?: boolean };
}

/**
 * Parse markdown-style links and convert to clickable HTML
 * Supports: [text](url) and bare URLs
 */
function parseMessageContent(content: string) {
  // Split content into parts to preserve structure
  const parts: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
  
  // Regex to match markdown links [text](url) and bare URLs
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  let lastIndex = 0;
  let match;
  
  // First, find all markdown links
  const markdownMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    markdownMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
      url: match[2],
    });
  }
  
  // Process content with markdown links
  markdownMatches.forEach((mdMatch) => {
    // Add text before this link
    if (mdMatch.start > lastIndex) {
      const textBefore = content.substring(lastIndex, mdMatch.start);
      // Check for bare URLs in the text before
      let textLastIndex = 0;
      let urlMatch;
      urlRegex.lastIndex = 0;
      while ((urlMatch = urlRegex.exec(textBefore)) !== null) {
        if (urlMatch.index > textLastIndex) {
          parts.push({ type: 'text', content: textBefore.substring(textLastIndex, urlMatch.index) });
        }
        parts.push({ type: 'link', content: urlMatch[1], url: urlMatch[1] });
        textLastIndex = urlMatch.index + urlMatch[1].length;
      }
      if (textLastIndex < textBefore.length) {
        parts.push({ type: 'text', content: textBefore.substring(textLastIndex) });
      }
    }
    
    // Add the markdown link
    parts.push({ type: 'link', content: mdMatch.text, url: mdMatch.url });
    lastIndex = mdMatch.end;
  });
  
  // Add remaining text after last markdown link
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    let textLastIndex = 0;
    let urlMatch;
    urlRegex.lastIndex = 0;
    while ((urlMatch = urlRegex.exec(remainingText)) !== null) {
      if (urlMatch.index > textLastIndex) {
        parts.push({ type: 'text', content: remainingText.substring(textLastIndex, urlMatch.index) });
      }
      parts.push({ type: 'link', content: urlMatch[1], url: urlMatch[1] });
      textLastIndex = urlMatch.index + urlMatch[1].length;
    }
    if (textLastIndex < remainingText.length) {
      parts.push({ type: 'text', content: remainingText.substring(textLastIndex) });
    }
  }
  
  // If no links found, return the whole content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }
  
  return parts;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  
  // Parse message content for links
  const contentParts = parseMessageContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
          AI
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {contentParts.map((part, index) => {
            if (part.type === 'link') {
              return (
                <a
                  key={index}
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline hover:no-underline transition-colors ${
                    isUser
                      ? 'text-blue-100 hover:text-white'
                      : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                  }`}
                >
                  {part.content}
                </a>
              );
            }
            return <span key={index}>{part.content}</span>;
          })}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-1 bg-blue-500 animate-pulse" />
          )}
        </div>
        <div
          className={`text-xs mt-2 ${
            isUser
              ? 'text-blue-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {formatRelativeTime(message.timestamp)}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-400 flex items-center justify-center text-white font-bold text-sm">
          U
        </div>
      )}
    </motion.div>
  );
}
