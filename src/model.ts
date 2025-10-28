import { createHash } from "crypto"

import type { ChatMessageItem } from "~options/chat"

const MULTIMODAL_CONFIG = {
  expectedInputs: [{ type: "text", languages: ["en"] }, { type: "image" }],
  expectedOutputs: [{ type: "text", languages: ["en"] }]
} as const

const checkAvailability = async (config?: any) => {
  const LanguageModel = (self as any).LanguageModel
  if (!LanguageModel) throw new Error("Chrome AI not available")

  const availability = await LanguageModel.availability(config)
  if (availability !== "available") {
    throw new Error(`Model not available: ${availability}`)
  }
  return LanguageModel
}

export const getLanguageModel = async () => {
  const LanguageModel = await checkAvailability()
  return await LanguageModel.create()
}

export const getImageModel = async () => {
  const config = {
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }]
  }
  const LanguageModel = await checkAvailability(config)
  return await LanguageModel.create({
    ...config,
    systemPrompt:
      "You are an image captioning assistant. Generate brief, descriptive captions."
  })
}

export const getAudioModel = async () => {
  const config = {
    expectedInputs: [{ type: "audio" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }]
  }
  const LanguageModel = await checkAvailability(config)
  return await LanguageModel.create({
    ...config,
    systemPrompt:
      "You are an audio transcription assistant. Transcribe audio accurately and concisely."
  })
}

const chatModelCache = new Map<string, any>()
const generateChatCacheKey = (
  systemPrompt: string,
  previousConversation: ChatMessageItem[]
): string => {
  const content = systemPrompt + JSON.stringify(previousConversation)
  return createHash("sha256").update(content).digest("hex")
}

export const getChatModel = async (
  systemPrompt: string,
  previousConversation: ChatMessageItem[] = []
) => {
  const cacheKey = generateChatCacheKey(systemPrompt, previousConversation)
  if (chatModelCache.has(cacheKey)) {
    return chatModelCache.get(cacheKey)
  }

  const LanguageModel = await checkAvailability(MULTIMODAL_CONFIG)
  const model = await LanguageModel.create({
    initialPrompts: [
      { role: "system", content: systemPrompt },
      ...previousConversation
    ],
    ...MULTIMODAL_CONFIG
  })

  chatModelCache.set(cacheKey, model)
  return model
}
