import { useLiveQuery } from "dexie-react-hooks"
import { Lightbulb } from "lucide-react"

import type { Intent } from "~background/messages/intent"
import db from "~db"

const getIntentIcon = (type: string) => {
  switch (type) {
    case "PROOFREAD":
      return "📝"
    case "TRANSLATE":
      return "🌐"
    case "REPHRASE":
      return "✏️"
    case "SUMMARIZE":
      return "📋"
    case "CHAT":
      return "💬"
    default:
      return "💡"
  }
}

export const IntentsTab = () => {
  const intentQueue = useLiveQuery(() => {
    return db
      .table<Intent>("intentQueue")
      .orderBy("timestamp")
      .reverse()
      .limit(20)
      .toArray()
  }, [])

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-4">
      {/* Intents Queue Section */}
      <div className="bg-white/40 dark:bg-slate-700/40 rounded-xl border border-gray-300/50 dark:border-slate-600/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100/80 dark:bg-indigo-900/40 backdrop-blur-sm rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
            <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Intent Queue
          </h3>
        </div>
        {intentQueue && intentQueue.length > 0 ? (
          <div className="space-y-3">
            {intentQueue.map((intent, index) => (
              <div
                key={index}
                className="bg-white/50 dark:bg-slate-600/40 backdrop-blur-sm p-4 rounded-lg border border-gray-300/50 dark:border-slate-500/50 shadow-md">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getIntentIcon(intent.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {intent.type}
                      </span>
                      {intent.type === "TRANSLATE" && "language" in intent && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          → {intent.language}
                        </span>
                      )}
                    </div>
                    {intent.type === "CHAT" && "payload" in intent ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {intent.payload}
                      </p>
                    ) : "text" in intent ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                        {intent.text}
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(intent.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">No intents in queue</p>
            <p className="text-xs italic">
              Use context menu actions to add intents
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
