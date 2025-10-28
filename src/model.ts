import { Storage } from "@plasmohq/storage"

import type { ChatMessageItem } from "~chat"
import { MODEL_TEMPERATURE_MULTIPLIER, MODEL_TOPK } from "~default-settings"
import { hashArray, hashString } from "~utils"

const storage = new Storage()

const MULTIMODAL_CONFIG = {
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "image" },
    { type: "audio" }
  ],
  expectedOutputs: [{ type: "text", languages: ["en"] }]
} as const

const getModelOptions = async () => {
  const LanguageModel = (self as any).LanguageModel

  // Get topK from storage or use default
  let topK: number = await storage.get(MODEL_TOPK.key)
  if (topK === undefined || topK === null) {
    if (typeof MODEL_TOPK.defaultValue === "function") {
      topK = await MODEL_TOPK.defaultValue()
    } else {
      topK = MODEL_TOPK.defaultValue
    }
  }

  // Get temperature multiplier from storage or use default
  let temperatureMultiplier: number = await storage.get(
    MODEL_TEMPERATURE_MULTIPLIER.key
  )
  if (temperatureMultiplier === undefined || temperatureMultiplier === null) {
    temperatureMultiplier = MODEL_TEMPERATURE_MULTIPLIER.defaultValue
  }

  // Ensure it's a number
  temperatureMultiplier = Number(temperatureMultiplier)

  // Get default temperature from model params
  const params = await LanguageModel.params()
  const temperature = Number(params.defaultTemperature) * temperatureMultiplier

  return {
    topK: Number(topK),
    temperature
  }
}

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
  const options = await getModelOptions()
  return await LanguageModel.create(options)
}

export const getImageModel = async () => {
  const config = {
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }]
  }
  const LanguageModel = await checkAvailability(config)
  const options = await getModelOptions()
  return await LanguageModel.create({
    ...config,
    ...options,
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
  const options = await getModelOptions()
  return await LanguageModel.create({
    ...config,
    ...options,
    systemPrompt:
      "You are an audio transcription assistant. Transcribe audio accurately and concisely."
  })
}

const chatModelCache = new Map<string, any>()
const generateChatCacheKey = (
  systemPrompt: string,
  previousConversation: ChatMessageItem[]
): string => {
  const arrayHash = hashArray(previousConversation)
  const content = systemPrompt + arrayHash
  return hashString(content)
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
  const options = await getModelOptions()
  const model = await LanguageModel.create({
    initialPrompts: [
      { role: "system", content: systemPrompt },
      ...previousConversation
    ],
    ...MULTIMODAL_CONFIG,
    ...options
  })

  chatModelCache.set(cacheKey, model)
  return model
}
