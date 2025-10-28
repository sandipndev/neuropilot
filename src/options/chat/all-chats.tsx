import { useLiveQuery } from "dexie-react-hooks"
import { MessageSquare, Plus } from "lucide-react"
import React, { useState } from "react"

import db, { type ChatMessage, type Chat as ChatType } from "~db"

import { Chat } from "./chat"

export const AllChats: React.FC = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)

  // Fetch all chats sorted by timestamp
  const chats = useLiveQuery(
    () => db.table<ChatType>("chat").orderBy("timestamp").reverse().toArray(),
    []
  )

  const createNewChat = async () => {
    const newChatId = `chat-${Date.now()}`
    await db.table<ChatType>("chat").add({
      id: newChatId,
      title: `Chat ${(chats?.length || 0) + 1}`,
      userActivity: {},
      timestamp: Date.now()
    })
    setSelectedChatId(newChatId)
  }

  const deleteChat = async (chatId: string) => {
    // Delete chat and all its messages
    await db.table<ChatType>("chat").delete(chatId)
    await db
      .table<ChatMessage>("chatMessages")
      .where("chatId")
      .equals(chatId)
      .delete()

    if (selectedChatId === chatId) {
      setSelectedChatId(null)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Chat History
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View and manage your conversation history
        </p>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Sidebar */}
        <div className="w-80 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md">
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats && chats.length > 0 ? (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`group p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedChatId === chat.id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-l-blue-500 shadow-sm"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare
                            size={16}
                            className={`flex-shrink-0 ${
                              selectedChatId === chat.id
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          />
                          <h3
                            className={`font-medium truncate text-sm ${
                              selectedChatId === chat.id
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-slate-900 dark:text-slate-100"
                            }`}>
                            {chat.title || "Untitled Chat"}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">
                          {formatTimestamp(chat.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm("Delete this chat?")) {
                            deleteChat(chat.id)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xl leading-none p-1"
                        title="Delete chat">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 p-4">
                <MessageSquare size={48} className="mb-3 opacity-50" />
                <p className="text-center font-medium">No chats yet</p>
                <p className="text-sm text-center mt-1">
                  Create your first chat to get started!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {selectedChatId ? (
            <>
              {/* Chat Header */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {chats?.find((c) => c.id === selectedChatId)?.title ||
                      "Chat"}
                  </h2>
                </div>
              </div>

              {/* Chat Component */}
              <div className="flex-1 overflow-hidden">
                <Chat chatId={selectedChatId} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <MessageSquare size={64} className="opacity-50" />
                  </div>
                </div>
                <p className="text-xl font-medium text-slate-600 dark:text-slate-400">
                  Select a chat to start messaging
                </p>
                <p className="text-sm mt-2 text-slate-500 dark:text-slate-500">
                  or create a new chat to begin
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
