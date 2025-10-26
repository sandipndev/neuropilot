/**
 * ChatSection Component
 * Provides AI chat functionality for productivity insights and assistance
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AlertCircle, RefreshCw, Trash2, Info, ImagePlus, X, Upload } from 'lucide-react';
import { getFileValidationError, createImageFile, cleanupImagePreview, type ImageFile } from '../lib/image-utils';
import { ChatMessage } from './ChatMessage';
import { sendChatMessage } from '../../../../../api/mutations/send-chat-message';
import { getChatMessages } from '../../../../../api/queries/chat-messages';
import { clearChatMessages } from '../../../../../api/mutations/clear-chat-messages';
import { checkChromeAIAvailability } from '../lib/chrome-ai';
import type { FocusWithParsedData } from '../types';

// Extended ChatMessage type with streaming support
interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatSectionProps {
  currentFocus?: FocusWithParsedData | null;
  focusHistory?: FocusWithParsedData[];
}

export function ChatSection({ currentFocus, focusHistory = [] }: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiStatus, setAiStatus] = useState<string>('Checking...');
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Chrome AI availability on mount
  useEffect(() => {
    const checkAI = async () => {
      const status = await checkChromeAIAvailability();
      setAiAvailable(status.available);
      setAiStatus(status.status);
      if (!status.available && status.instructions) {
        setError(status.instructions);
      }
    };
    checkAI();
  }, []);

  // Load previous chat messages on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const previousMessages = await getChatMessages();
        setMessages(previousMessages);
      } catch (err) {
        console.error('Error loading chat history:', err);
        // Don't show error to user, just start with empty state
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle message sending
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Store image reference before clearing
    const imageToSend = selectedImage;

    // Clear input, error, and image
    setInputValue('');
    setError(null);
    setUploadError(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Build user message content with image indicator
    let userMessageContent = trimmedMessage;
    if (imageToSend) {
      userMessageContent = `${trimmedMessage}\n[Image attached: ${imageToSend.name}]`;
    }

    // Add user message immediately
    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      role: 'user',
      content: userMessageContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsWaitingForResponse(true);

    // Create a temporary assistant message for streaming (but don't add it yet)
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    try {
      // Convert image to base64 if present
      let imageData: string | undefined;
      if (imageToSend) {
        imageData = imageToSend.preview;
        // Clean up after sending
        cleanupImagePreview(imageToSend);
      }

      // Prepare context with image
      const context = {
        currentFocus: currentFocus?.focus_item,
        recentActivities: focusHistory.slice(0, 5).map((f) => f.focus_item),
        imageData,
      };

      // Send message and stream the response
      let hasStartedStreaming = false;
      await sendChatMessage({
        message: trimmedMessage,
        context,
        onChunk: (chunk: string, done: boolean) => {
          // On first chunk, hide loading indicator and add assistant message
          if (!hasStartedStreaming && chunk) {
            hasStartedStreaming = true;
            setIsWaitingForResponse(false);
            
            // Add the assistant message with first chunk
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: chunk,
                timestamp: Date.now(),
                isStreaming: true,
              },
            ]);
          } else if (hasStartedStreaming) {
            // Update the assistant's message with subsequent chunks
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: msg.content + chunk,
                      isStreaming: !done,
                      timestamp: Date.now(),
                    }
                  : msg
              )
            );
          }
        },
      });
    } catch (err) {
      console.error('Error sending chat message:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setIsWaitingForResponse(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, currentFocus, focusHistory]);

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Retry last message
  const handleRetry = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === 'user');
      if (lastUserMessage) {
        setInputValue(lastUserMessage.content);
        setError(null);
        inputRef.current?.focus();
      }
    }
  }, [messages]);

  // Clear all messages
  const handleClearChat = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
      try {
        await clearChatMessages();
        setMessages([]);
        setError(null);
      } catch (err) {
        console.error('Error clearing chat messages:', err);
        setError('Failed to clear chat messages. Please try again.');
      }
    }
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file
    const validationError = getFileValidationError(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Clean up previous image if exists
    if (selectedImage) {
      cleanupImagePreview(selectedImage);
    }

    // Create image file with preview
    const imageFile = createImageFile(file);
    setSelectedImage(imageFile);
  }, [selectedImage]);

  // Remove selected image
  const handleRemoveImage = useCallback(() => {
    if (selectedImage) {
      cleanupImagePreview(selectedImage);
    }
    setSelectedImage(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedImage]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!target.contains(relatedTarget)) {
      setDragActive(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!aiAvailable || isLoading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Only take first file
    setUploadError(null);

    // Validate file
    const validationError = getFileValidationError(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Clean up previous image if exists
    if (selectedImage) {
      cleanupImagePreview(selectedImage);
    }

    // Create image file with preview
    const imageFile = createImageFile(file);
    setSelectedImage(imageFile);
  }, [aiAvailable, isLoading, selectedImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) {
        cleanupImagePreview(selectedImage);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-800/50 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200/50 dark:border-gray-700/50 shrink-0">
        <span className="text-xl">💬</span>
        <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          AI Assistant
        </h2>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                aiAvailable ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={aiStatus}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:inline">
              {aiAvailable ? 'Chrome AI Ready' : 'AI Unavailable'}
            </span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Clear chat history"
              title="Clear all messages"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Unavailable Banner */}
      {!aiAvailable && !isLoadingHistory && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Chrome AI Not Available</p>
              <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-300">
                {aiStatus}. You can still view your chat history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {isLoadingHistory ? (
          <LoadingHistoryState />
        ) : messages.length === 0 ? (
          <EmptyState aiAvailable={aiAvailable} />
        ) : (
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </AnimatePresence>
        )}

        {/* Loading Indicator - Only show when waiting for first response */}
        {isWaitingForResponse && <LoadingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div 
        className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 shrink-0 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Drop image here</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-700 dark:text-red-300">{uploadError}</span>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                aria-label="Dismiss error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img
              src={selectedImage.preview}
              alt={selectedImage.name}
              className="h-20 w-20 object-cover rounded-lg border-2 border-blue-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 rounded-b-lg truncate">
              {selectedImage.name}
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={aiAvailable ? "Ask me..." : "AI unavailable"}
            disabled={isLoading || !aiAvailable}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label="Chat message input"
          />
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            aria-label="Upload image"
          />
          
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !aiAvailable}
            className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
            aria-label="Upload image for context"
            title="Upload image for context"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !aiAvailable}
            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-md"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Loading History State Component
function LoadingHistoryState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="animate-pulse space-y-4 w-full max-w-md">
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 ml-auto"></div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  aiAvailable: boolean;
}

function EmptyState({ aiAvailable }: EmptyStateProps) {
  if (!aiAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          Chrome AI Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Chrome AI requires Chrome 127+ with specific flags enabled.
        </p>
        <div className="mt-6 space-y-2 text-sm text-gray-500 dark:text-gray-500">
          <p>To enable Chrome AI:</p>
          <ol className="space-y-1 text-left max-w-md">
            <li>1. Visit chrome://flags</li>
            <li>2. Enable "Prompt API for Gemini Nano"</li>
            <li>3. Enable "Enables optimization guide on device"</li>
            <li>4. Restart Chrome</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="text-6xl mb-4">🤖</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
        Start a Conversation
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md">
        Ask me about your productivity patterns, get focus tips, or discuss your
        recent activities. I'm here to help!
      </p>
      <div className="mt-6 space-y-2 text-sm text-gray-500 dark:text-gray-500">
        <p>💡 Try asking:</p>
        <ul className="space-y-1">
          <li>"How productive was I today?"</li>
          <li>"What should I focus on next?"</li>
          <li>"Give me tips for staying focused"</li>
        </ul>
      </div>
    </div>
  );
}

// Loading Indicator Component
function LoadingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
        AI
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
