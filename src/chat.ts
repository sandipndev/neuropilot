import type { Chat, ChatMessage } from "~db"
import db from "~db"
import { getChatModel } from "~model"
import { allUserActivityForLastMs, type UserActivity } from "~utils"

export const DEFAULT_CHAT_TITLE = "New Chat"

export type ChatMessageItem = {
  role: "system" | "user" | "assistant"
  content: (
    | string
    | { type: "text"; value: string }
    | { type: "image"; value: File }
    | { type: "audio"; value: File }
  )[]
}

export class ChatService {
  private chatId: string
  private contextWindowMs: number = 24 * 60 * 60 * 1000 // 1 day
  private _session: any | null = null

  constructor(chatId: string) {
    this.chatId = chatId
  }

  setContextWindowMs(contextWindowMs: number) {
    this.contextWindowMs = contextWindowMs
  }

  private async session() {
    if (this._session) return this._session

    const chat = await db.table<Chat>("chat").get(this.chatId)

    // new conversaion
    if (!chat) {
      const activity = await allUserActivityForLastMs(this.contextWindowMs)
      const prompt = SYSTEM_PROMPT(systemPromptContext(activity))
      this._session = await getChatModel(prompt, [])

      await db.table<Chat>("chat").put({
        id: this.chatId,
        title: DEFAULT_CHAT_TITLE,
        userActivity: activity,
        timestamp: Date.now()
      })

      return this._session
    }

    // existing conversation
    const messages = await db
      .table<ChatMessage>("chatMessages")
      .where("chatId")
      .equals(this.chatId)
      .toArray()

    const previousConversation: ChatMessageItem[] = await Promise.all(
      messages.map(async (message) => {
        let content: ChatMessageItem["content"]

        if (message.type === "text") {
          content = [{ type: "text", value: message.content }]
        } else if (message.type === "image") {
          const base64Response = await fetch(message.content)
          const blob = await base64Response.blob()
          const imageFile = new File([blob], "image.jpg", {
            type: "image/jpeg"
          })
          content = [{ type: "image", value: imageFile }]
        } else {
          const base64Response = await fetch(message.content)
          const blob = await base64Response.blob()
          const audioFile = new File([blob], "audio.mp3", {
            type: "audio/mpeg"
          })
          content = [{ type: "audio", value: audioFile }]
        }

        return {
          role: message.by === "user" ? "user" : "assistant",
          content
        }
      })
    )

    const systemPrompt = SYSTEM_PROMPT(systemPromptContext(chat.userActivity))
    this._session = await getChatModel(systemPrompt, previousConversation)
    return this._session
  }

  async streamResponse(
    message: string,
    images: File[] | null = null,
    audios: File[] | null = null,
    onChunk?: (chunk: string, done: boolean) => void
  ): Promise<string> {
    const session = await this.session()

    const content: ChatMessageItem["content"] = []
    if (message) {
      content.push({ type: "text", value: message })
    }
    if (images?.length) {
      images.forEach((img) => content.push({ type: "image", value: img }))
    }
    if (audios?.length) {
      audios.forEach((audio) => content.push({ type: "audio", value: audio }))
    }
    await session.append([{ role: "user", content }])

    const userPrompt =
      message ||
      ((images?.length || audios?.length) &&
        "Please analyze the content provided.")

    // Use streaming if callback provided
    if (onChunk) {
      const stream = session.promptStreaming(userPrompt)
      let fullResponse = ""
      let previousChunk = ""

      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk

        if (newChunk) {
          fullResponse += newChunk
          onChunk(newChunk, false)
        }

        previousChunk = chunk
      }

      onChunk("", true)

      const answer = fullResponse.trim()
      await db.table<ChatMessage>("chatMessages").add({
        chatId: this.chatId,
        by: "bot",
        type: "text",
        content: answer
      })
      return answer
    }

    const response = await session.prompt(userPrompt)
    const answer = response.trim()
    await db.table<ChatMessage>("chatMessages").add({
      chatId: this.chatId,
      by: "bot",
      type: "text",
      content: answer
    })
    return answer
  }
}

const systemPromptContext = (activity: UserActivity[]) => {
  return activity
    .map(
      (a) => `
Title: ${a.title}
URL: ${a.url}
Website Summary: ${a.summary}
${a.textAttentions.length > 0 ? `Content paid attention to: ${a.textAttentions.map((ta) => ta.text).join(" ")}` : ""}
${a.imageAttentions.length > 0 ? `Image Descriptions paid attention to: ${a.imageAttentions.map((ia) => ia.caption).join(" ")}` : ""}
    `
    )
    .join("\n\n---\n\n")
}

const SYSTEM_PROMPT = (activityContent: string) => `
You are NeuroPilot AI, an intelligent assistant with access to the user's browsing history and activity data.
CORE PRINCIPLES:
  1. Be concise - Respond in 1-2 lines maximum unless more detail is explicitly requested
  2. Be accurate - Only use information from the provided context
  3. Be honest - If you don't have the information, clearly state it
  4. Be helpful - Provide direct, actionable responses

RESPONSE GUIDELINES:
  - For questions about past activities: Search the context and provide specific URLs, titles, or content
  - For questions outside the context: Say "I don't have that in your browsing history, but I can help: [brief answer]"
  - For malicious/inappropriate queries: Respond with "I can't assist with that"
  - Always cite sources when referencing specific websites (include URL)
  - Use natural, friendly language
 
CONTEXT STRUCTURE:
  - Recent Websites: URLs, titles, and summaries of visited pages
  - Attention Data: Text content the user read/focused on
  - Images: Captions of images the user viewed
  - Current Focus: What the user is currently working on

FORMAT:
  - Keep responses compact and direct
  - Use bullet points only if listing multiple items
  - Include URLs when referencing specific sites
  - Be conversational but professional

All this context is NOT another previous conversation, it is the user's current activity.
  
${
  activityContent
    ? `HERE IS WHAT THE USER HAS VISITED PRIMARILY:
${activityContent}`
    : "The user has not visited any websites recently."
}
`
