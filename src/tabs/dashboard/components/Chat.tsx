// import { useLiveQuery } from "dexie-react-hooks"
// import { MessageSquare, Plus } from "lucide-react"
// import React, { useCallback, useEffect, useMemo, useState } from "react"

// import db, { type ChatMessage, type Chat as ChatType } from "~db"

// import ChatConversation from "./ChatConversation"

// const generateChatId = () =>
//   `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// const Chat: React.FC = () => {
//   const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
//   const [usageInfo, setUsageInfo] = useState<{
//     inputUsage: number
//     inputQuota: number
//   } | null>(null)

//   // Fetch all chats sorted by timestamp
//   const chats = useLiveQuery(
//     () => db.table<ChatType>("chat").orderBy("timestamp").reverse().toArray(),
//     []
//   )

//   // Check if selected chat is a new chat (not in database)
//   const isNewChat = useMemo(() => {
//     if (!selectedChatId || !chats) return false
//     return !chats.some((chat) => chat.id === selectedChatId)
//   }, [selectedChatId, chats])

//   // Automatically show new chat if there are no chats
//   useEffect(() => {
//     if (chats !== undefined && chats.length === 0 && selectedChatId === null) {
//       const newId = generateChatId()
//       setSelectedChatId(newId)
//     }
//   }, [chats, selectedChatId])

//   // Reset usage info when switching chats
//   useEffect(() => {
//     setUsageInfo(null)
//   }, [selectedChatId])

//   const createNewChat = () => {
//     const newId = generateChatId()
//     setSelectedChatId(newId)
//   }



//   const deleteChat = async (chatIdToDelete: string) => {
//     // Delete chat and all its messages
//     await db.table<ChatType>("chat").delete(chatIdToDelete)
//     await db
//       .table<ChatMessage>("chatMessages")
//       .where("chatId")
//       .equals(chatIdToDelete)
//       .delete()

//     if (selectedChatId === chatIdToDelete) {
//       setSelectedChatId(null)
//     }
//   }

//   const formatTimestamp = useCallback((timestamp: number) => {
//     const date = new Date(timestamp)
//     const now = new Date()
//     const diff = now.getTime() - date.getTime()
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24))

//     if (days === 0) {
//       return date.toLocaleTimeString("en-US", {
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true
//       })
//     } else if (days === 1) {
//       return "Yesterday"
//     } else if (days < 7) {
//       return `${days} days ago`
//     } else {
//       return date.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric"
//       })
//     }
//   }, [])

//   return (
//     <div className="h-full flex gap-6 p-6">
//       {/* Sidebar */}
//       <div className="w-80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col shadow-lg">
//         {/* Header */}
//         <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
//           <button
//             onClick={createNewChat}
//             className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]">
//             <Plus size={20} />
//             <span>New Chat</span>
//           </button>
//         </div>

//         {/* Chat List */}
//         <div className="flex-1 overflow-y-auto scrollbar-thin">
//           {chats && chats.length > 0 ? (
//             <div className="p-2">
//               {chats.map((chat) => (
//                 <div
//                   key={chat.id}
//                   onClick={() => setSelectedChatId(chat.id)}
//                   className={`group p-3 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${
//                     selectedChatId === chat.id
//                       ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-l-blue-500 shadow-md scale-[1.02]"
//                       : "hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-sm"
//                   }`}>
//                   <div className="flex items-start justify-between gap-2">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center gap-2 mb-1">
//                         <MessageSquare
//                           size={16}
//                           className={`flex-shrink-0 ${
//                             selectedChatId === chat.id
//                               ? "text-blue-600 dark:text-blue-400"
//                               : "text-slate-400 dark:text-slate-500"
//                           }`}
//                         />
//                         <h3
//                           className={`font-semibold truncate text-sm ${
//                             selectedChatId === chat.id
//                               ? "text-blue-900 dark:text-blue-100"
//                               : "text-slate-900 dark:text-slate-100"
//                           }`}>
//                           {chat.title || "Untitled Chat"}
//                         </h3>
//                       </div>
//                       <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">
//                         {formatTimestamp(chat.timestamp)}
//                       </p>
//                     </div>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation()
//                         if (window.confirm("Delete this chat?")) {
//                           deleteChat(chat.id)
//                         }
//                       }}
//                       className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-xl leading-none p-1"
//                       title="Delete chat">
//                       ×
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full p-4">
//               <div className="text-center">
//                 <div className="mb-4 flex justify-center">
//                   <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200/50 dark:border-blue-800/50">
//                     <MessageSquare
//                       size={48}
//                       className="text-blue-600 dark:text-blue-400"
//                     />
//                   </div>
//                 </div>
//                 <p className="text-center font-semibold text-slate-700 dark:text-slate-300 mb-1">
//                   No chats yet
//                 </p>
//                 <p className="text-sm text-center text-slate-500 dark:text-slate-400">
//                   Create your first chat to get started!
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Main Chat Area */}
//       <div className="flex-1 flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
//         {selectedChatId ? (
//           <>
//             {/* Chat Header */}
//             <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-4">
//               <div className="flex items-center justify-between gap-3">
//                 <div className="flex items-center gap-3">
//                   <div className="p-2.5 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
//                     <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
//                   </div>
//                   <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
//                     {isNewChat
//                       ? "New Chat"
//                       : chats?.find((c) => c.id === selectedChatId)?.title ||
//                         "Chat"}
//                   </h2>
//                 </div>
//                 {usageInfo && (
//                   <div
//                     className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
//                       usageInfo.inputUsage / usageInfo.inputQuota < 0.6
//                         ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
//                         : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
//                     }`}>
//                     {usageInfo.inputUsage} / {usageInfo.inputQuota}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Chat Component */}
//             <div className="flex-1 overflow-hidden">
//               <ChatConversation
//                 chatId={selectedChatId}
//                 isNewChat={isNewChat}
//                 onChatCreated={handleChatCreated}
//                 onUsageUpdate={setUsageInfo}
//               />
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center">
//             <div className="text-center">
//               <div className="mb-6 flex justify-center">
//                 <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full border border-blue-200/50 dark:border-blue-800/50 shadow-lg">
//                   <MessageSquare
//                     size={64}
//                     className="text-blue-600 dark:text-blue-400"
//                   />
//                 </div>
//               </div>
//               <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
//                 Select a Chat
//               </h3>
//               <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
//                 Choose a conversation from the sidebar or create a new chat to
//                 get started
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

export default {}
