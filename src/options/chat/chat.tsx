import { useLiveQuery } from "dexie-react-hooks"
import { Image, MessageSquare, Mic, Send } from "lucide-react"
import { marked } from "marked"
import React, { useEffect, useMemo, useRef, useState } from "react"

import { ChatService } from "~chat"
import db, { type ChatMessage } from "~db"

interface ChatProps {
  chatId: string
  isNewChat?: boolean
  onChatCreated?: (chatId: string) => void
  onUsageUpdate?: (usage: { inputUsage: number; inputQuota: number }) => void
}

const CONTEXT_WINDOWS = [
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "4 hours", value: 4 * 60 * 60 * 1000 },
  { label: "1 day", value: 24 * 60 * 60 * 1000 }
]

export const Chat: React.FC<ChatProps> = ({
  chatId,
  isNewChat = false,
  onChatCreated,
  onUsageUpdate
}) => {
  const [messageText, setMessageText] = useState("")
  const [contextWindowMs, setContextWindowMs] = useState(30 * 60 * 1000) // Default: 30 minutes
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedAudios, setSelectedAudios] = useState<File[]>([])
  const [usageInfo, setUsageInfo] = useState<{
    inputUsage: number
    inputQuota: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const MAX_FILES = 5

  // Memoize ChatService instance
  const chatService = useMemo(() => {
    const service = new ChatService(chatId)
    service.setContextWindowMs(contextWindowMs)
    return service
  }, [chatId, contextWindowMs])

  // Fetch messages for this chat
  const messages = useLiveQuery(() => {
    return db
      .table<ChatMessage>("chatMessages")
      .where("chatId")
      .equals(chatId)
      .toArray()
  }, [chatId])

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingMessage])

  useEffect(() => {
    const session = chatService.getSession()
    if (session) {
      const { inputUsage, inputQuota } = session
      const usage = { inputUsage, inputQuota }
      setUsageInfo(usage)
      onUsageUpdate?.(usage)
    }
  }, [messages, onUsageUpdate])

  useEffect(() => {
    return () => {
      if (chatService.getSession()) {
        chatService.destroy()
      }
    }
  }, [chatService])

  const handleSendMessage = async () => {
    if (
      (!messageText.trim() &&
        selectedImages.length === 0 &&
        selectedAudios.length === 0) ||
      isStreaming
    )
      return

    // Save user text message to DB if there is text
    if (messageText.trim()) {
      await db.table<ChatMessage>("chatMessages").add({
        chatId,
        by: "user",
        type: "text",
        content: messageText
      })
    }

    // Save images to DB
    for (const image of selectedImages) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(image)
      })
      await db.table<ChatMessage>("chatMessages").add({
        chatId,
        by: "user",
        type: "image",
        content: base64
      })
    }

    // Save audios to DB
    for (const audio of selectedAudios) {
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(audio)
      })
      await db.table<ChatMessage>("chatMessages").add({
        chatId,
        by: "user",
        type: "audio",
        content: base64
      })
    }

    const userMessage = messageText
    const images = selectedImages.length > 0 ? selectedImages : null
    const audios = selectedAudios.length > 0 ? selectedAudios : null

    setMessageText("")
    setSelectedImages([])
    setSelectedAudios([])

    // Notify parent that chat has been created (if new)
    if (isNewChat) {
      onChatCreated?.(chatId)
    }

    // Get bot response using ChatService with streaming
    setIsStreaming(true)
    setStreamingMessage("")

    try {
      await chatService.streamResponse(
        userMessage,
        images,
        audios,
        (chunk: string, done: boolean) => {
          if (done) {
            setIsStreaming(false)
            setStreamingMessage("")
          } else {
            setStreamingMessage((prev) => prev + chunk)
          }
        }
      )
    } catch (error) {
      console.error("Error getting response:", error)
      setIsStreaming(false)
      setStreamingMessage("")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const imageFiles = files.filter((f) => f.type.startsWith("image/"))

    const totalFiles =
      selectedImages.length + selectedAudios.length + imageFiles.length
    if (totalFiles > MAX_FILES) {
      alert(`You can only attach up to ${MAX_FILES} files total`)
      return
    }

    setSelectedImages((prev) => [...prev, ...imageFiles])
    e.target.value = "" // Reset input
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const audioFiles = files.filter((f) => f.type.startsWith("audio/"))

    const totalFiles =
      selectedImages.length + selectedAudios.length + audioFiles.length
    if (totalFiles > MAX_FILES) {
      alert(`You can only attach up to ${MAX_FILES} files total`)
      return
    }

    setSelectedAudios((prev) => [...prev, ...audioFiles])
    e.target.value = "" // Reset input
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeAudio = (index: number) => {
    setSelectedAudios((prev) => prev.filter((_, i) => i !== index))
  }

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.by === "user"

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fadeIn`}>
        <div
          className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm"
          }`}>
          {message.type === "text" && (
            <div
              className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2"
              dangerouslySetInnerHTML={{
                __html: marked.parse(message.content) as string
              }}
            />
          )}
          {message.type === "image" && (
            <img
              src={message.content}
              alt="Uploaded"
              className="max-w-full rounded-lg"
            />
          )}
          {message.type === "audio" && (
            <audio controls className="max-w-full">
              <source src={message.content} />
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {messages && messages.length > 0 ? (
          <>
            {messages.map(renderMessage)}
            {isStreaming && streamingMessage && (
              <div className="flex justify-start mb-4 animate-fadeIn">
                <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl shadow-sm bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2"
                    dangerouslySetInnerHTML={{
                      __html: marked.parse(streamingMessage) as string
                    }}
                  />
                  <div className="flex items-center justify-start gap-2 text-xs mt-2 text-slate-500 dark:text-slate-400">
                    <div className="inline-block w-3 h-3 bg-slate-900 dark:bg-slate-100 rounded-full animate-pulse" />
                    <div>AI is thinking...</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400 dark:text-slate-500">
              <div className="mb-3 flex justify-center">
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                  <MessageSquare size={32} className="opacity-50" />
                </div>
              </div>
              <p className="font-medium">No messages yet</p>
              <p className="text-sm mt-1">Start a conversation!</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Window Selector - Only shown when no messages */}
      {(!messages || messages.length === 0) && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Context:
            </span>
            {CONTEXT_WINDOWS.map((window) => (
              <button
                key={window.value}
                onClick={() => setContextWindowMs(window.value)}
                className={`px-2 py-1 rounded transition-all duration-200 whitespace-nowrap ${
                  contextWindowMs === window.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}>
                {window.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {/* Selected Files Preview */}
        {(selectedImages.length > 0 || selectedAudios.length > 0) && (
          <div className="px-4 pt-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((image, idx) => (
                <div
                  key={`img-${idx}`}
                  className="relative group bg-slate-200 dark:bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                  <Image
                    size={16}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {image.name}
                  </span>
                  <button
                    onClick={() => removeImage(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:hover:text-red-400 text-lg leading-none"
                    title="Remove">
                    ×
                  </button>
                </div>
              ))}
              {selectedAudios.map((audio, idx) => (
                <div
                  key={`audio-${idx}`}
                  className="relative group bg-slate-200 dark:bg-slate-700 rounded-lg p-2 flex items-center gap-2">
                  <Mic
                    size={16}
                    className="text-slate-600 dark:text-slate-400"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                    {audio.name}
                  </span>
                  <button
                    onClick={() => removeAudio(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:hover:text-red-400 text-lg leading-none"
                    title="Remove">
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-end gap-2">
            {/* Image Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={
                selectedImages.length + selectedAudios.length >= MAX_FILES ||
                isStreaming
              }
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach Image">
              <Image size={20} />
            </button>

            {/* Audio Upload */}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleAudioUpload}
              className="hidden"
            />
            <button
              onClick={() => audioInputRef.current?.click()}
              disabled={
                selectedImages.length + selectedAudios.length >= MAX_FILES ||
                isStreaming
              }
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach Audio">
              <Mic size={20} />
            </button>

            {/* Text Input */}
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Type a message..."
              className="flex-1 resize-none border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={
                (!messageText.trim() &&
                  selectedImages.length === 0 &&
                  selectedAudios.length === 0) ||
                isStreaming
              }
              className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              title="Send Message">
              {isStreaming ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div
                    className="w-2 h-2 rounded-full bg-white"
                    style={{
                      animation: "pulse 1.5s ease-in-out infinite",
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.2)"
                    }}
                  />
                  <style>{`
                    @keyframes pulse {
                      0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                      }
                      50% {
                        opacity: 0.6;
                        transform: scale(1.4);
                      }
                    }
                  `}</style>
                </div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
