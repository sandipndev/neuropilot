import { Storage } from "@plasmohq/storage"

import type { ChatMessageItem } from "~chat"
import { MODEL_TEMPERATURE_MULTIPLIER, MODEL_TOPK } from "~default-settings"

const storage = new Storage()

//////// PROMPT API ////////

interface LanguageModelSession {
  prompt: (input: string) => Promise<string>
  promptStreaming: (input: string) => AsyncIterable<string>
  destroy: () => void
}

const MULTIMODAL_CONFIG = {
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "image" },
    { type: "audio" }
  ],
  expectedOutputs: [{ type: "text", languages: ["en"] }]
} as const

const getLanguageModelOptions = async () => {
  const LanguageModel = (self as { LanguageModel?: { params: () => Promise<{ defaultTemperature: number; defaultTopK: number }>; create: (options: Record<string, unknown>) => Promise<LanguageModelSession>; availability: (config?: Record<string, unknown>) => Promise<string> } }).LanguageModel

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

  temperatureMultiplier = Number(temperatureMultiplier)
  const params = await LanguageModel?.params()
  const temperature = Number(params?.defaultTemperature ?? 1.0) * temperatureMultiplier

  return {
    topK: Number(topK),
    temperature
  }
}

const checkLanguageModelAvailability = async (config?: Record<string, unknown>) => {
  const LanguageModel = (self as { LanguageModel?: { params: () => Promise<{ defaultTemperature: number; defaultTopK: number }>; create: (options: Record<string, unknown>) => Promise<LanguageModelSession>; availability: (config?: Record<string, unknown>) => Promise<string> } }).LanguageModel
  if (!LanguageModel) throw new Error("Chrome AI not available")

  const availability = await LanguageModel.availability(config)
  if (availability !== "available") {
    throw new Error(`Model not available: ${availability}`)
  }
  return LanguageModel
}

export const getLanguageModel = async (): Promise<LanguageModelSession> => {
  const LanguageModel = await checkLanguageModelAvailability()
  const options = await getLanguageModelOptions()
  return await LanguageModel.create(options)
}

export const getImageModel = async () => {
  const config = {
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }]
  }
  const LanguageModel = await checkLanguageModelAvailability(config)
  const options = await getLanguageModelOptions()
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
  const LanguageModel = await checkLanguageModelAvailability(config)
  const options = await getLanguageModelOptions()
  return await LanguageModel.create({
    ...config,
    ...options,
    systemPrompt:
      "You are an audio transcription assistant. Transcribe audio accurately and concisely."
  })
}

export const getChatModel = async (
  systemPrompt: string,
  previousConversation: ChatMessageItem[] = []
) => {
  const LanguageModel = await checkLanguageModelAvailability(MULTIMODAL_CONFIG)
  const options = await getLanguageModelOptions()
  const model = await LanguageModel.create({
    initialPrompts: [
      { role: "system", content: systemPrompt },
      ...previousConversation
    ],
    ...MULTIMODAL_CONFIG,
    ...options
  })
  return model
}

//////// SUMMARIZER API ////////
interface SummarizerSession {
  summarize: (text: string) => Promise<string>
  summarizeStreaming: (text: string) => AsyncIterable<string>
  destroy: () => void
}

const checkSummarizerAvailability = async () => {
  const Summarizer = (self as { Summarizer?: { create: (options: Record<string, unknown>) => Promise<SummarizerSession> } }).Summarizer
  if (!Summarizer) throw new Error("Summarizer not available")
  return Summarizer
}

export const getSummarizer = async (
  type: "tldr" | "teaser" | "key-points" | "headline"
) => {
  const Summarizer = await checkSummarizerAvailability()
  return await Summarizer.create({
    type,
    format: "plain-text"
  })
}

//////// REWRITE API ////////

interface RewriterSession {
  rewrite: (text: string) => Promise<string>
  rewriteStreaming: (text: string) => AsyncIterable<string>
  destroy: () => void
}

const checkRewriterAvailability = async () => {
  const Rewriter = (self as { Rewriter?: { create: (options: Record<string, unknown>) => Promise<RewriterSession> } }).Rewriter
  if (!Rewriter) throw new Error("Rewriter not available")
  return Rewriter
}

export const getRewriter = async (
  tone: "formal" | "as-is" | "more-casual",
  length: "shorter" | "as-is" | "longer"
) => {
  const Rewriter = await checkRewriterAvailability()
  return await Rewriter.create({
    tone,
    length,
    format: "plain-text"
  })
}

//////// WRITER API ////////
interface WriterSession {
  write: (prompt: string, options?: Record<string, unknown>) => Promise<string>
  writeStreaming: (prompt: string, options?: Record<string, unknown>) => AsyncIterable<string>
  destroy: () => void
}

const checkWriterAvailability = async () => {
  const Writer = (self as { Writer?: { create: (options: Record<string, unknown>) => Promise<WriterSession> } }).Writer
  if (!Writer) throw new Error("Writer not available")
  return Writer
}

export const getWriter = async (tone: "formal" | "neutral" | "casual") => {
  const Writer = await checkWriterAvailability()
  return await Writer.create({
    tone,
    format: "plain-text"
  })
}
