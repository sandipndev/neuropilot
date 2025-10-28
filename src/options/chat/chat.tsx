import { useLiveQuery } from "dexie-react-hooks"
import { Image, MessageSquare, Mic, Send } from "lucide-react"
import React, { useRef, useState } from "react"

import db, { type ChatMessage } from "~db"

interface ChatProps {
  chatId: string
}

const CONTEXT_WINDOWS = [
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "4 hours", value: 4 * 60 * 60 * 1000 },
  { label: "1 day", value: 24 * 60 * 60 * 1000 }
]

export const Chat: React.FC<ChatProps> = ({ chatId }) => {
  const [messageText, setMessageText] = useState("")
  const [contextWindowMs, setContextWindowMs] = useState(30 * 60 * 1000) // Default: 30 minutes
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  // Fetch messages for this chat
  const messages = useLiveQuery(
    () =>
      db
        .table<ChatMessage>("chatMessages")
        .where("chatId")
        .equals(chatId)
        .toArray(),
    [chatId]
  )

  const handleSendMessage = async () => {
    if (!messageText.trim()) return

    await db.table<ChatMessage>("chatMessages").add({
      chatId,
      by: "user",
      type: "text",
      content: messageText
    })

    setMessageText("")

    // TODO: Use contextWindowMs to fetch user activity from the selected time window
    // Example: const startTime = Date.now() - contextWindowMs

    // Simulate bot response
    setTimeout(async () => {
      await db.table<ChatMessage>("chatMessages").add({
        chatId,
        by: "bot",
        type: "text",
        content: "This is a simulated bot response."
      })
    }, 1000)
  }

  const handleFileUpload = async (file: File, type: "image" | "audio") => {
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64 = reader.result as string
      await db.table<ChatMessage>("chatMessages").add({
        chatId,
        by: "user",
        type,
        content: base64
      })
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file, "image")
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      handleFileUpload(file, "audio")
    }
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
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
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
          messages.map(renderMessage)
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
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Context Window
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_WINDOWS.map((window) => (
                <button
                  key={window.value}
                  onClick={() => setContextWindowMs(window.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    contextWindowMs === window.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}>
                  {window.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select how far back in time to include context from your browsing
              activity
            </p>
          </div>
        </div>
      )}

      {/* Input Container */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-end gap-2">
          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
            title="Attach Image">
            <Image size={20} />
          </button>

          {/* Audio Upload */}
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          <button
            onClick={() => audioInputRef.current?.click()}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
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
            disabled={!messageText.trim()}
            className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
            title="Send Message">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
