import { getChatModel } from "~model"
import { allUserActivityForLastMs } from "~utils"

export type ChatMessageItem = {
  role: "system" | "user"
  content: (
    | string
    | { type: "text"; value: string }
    | { type: "image"; value: File }
  )[]
}

export const streamResponse = async (
  message: string,
  images: File[] | null = null,
  onChunk?: (chunk: string, done: boolean) => void
) => {
  const LAST_DAY = 24 * 60 * 60 * 1000
  const prompt = SYSTEM_PROMPT(await chatContext(LAST_DAY))
  const model = await getChatModel(prompt, [])

  const content: ChatMessageItem["content"] = []
  if (message) {
    content.push({ type: "text", value: message })
  }
  if (images?.length) {
    images.forEach((img) => content.push({ type: "image", value: img }))
  }
  await model.append([{ role: "user", content }])

  const userPrompt = images?.length
    ? "Please analyze the content and images provided."
    : message

  // Use streaming if callback provided
  if (onChunk) {
    const stream = model.promptStreaming(userPrompt)
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
    return fullResponse.trim()
  }

  // Fallback to non-streaming
  const response = await model.prompt(userPrompt)
  return response.trim()
}

const chatContext = async (ms: number) => {
  const activity = await allUserActivityForLastMs(ms)

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
  
HERE IS WHAT THE USER HAS VISITED PRIMARILY:
${activityContent}
`
