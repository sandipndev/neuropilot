import { type PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import { COGNITIVE_ATTENTION_SHOW_OVERLAY } from "~default-settings"
import { getAudioModel } from "~model"

import CognitiveAttentionAudioTracker from "../cognitive-attention/monitor-audio"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: ["*://*.youtube.com/*"],
  all_frames: false
}

const COGNITIVE_ATTENTION_AUDIO_MESSAGE_NAME = "cognitive-attention-audio"

const storage = new Storage()
let audioTracker: CognitiveAttentionAudioTracker | null = null

const URL = location.href

const cachedAudioSummaries = new Map<string, string>()

const initAudioTracker = async () => {
  const showOverlay =
    String(await storage.get(COGNITIVE_ATTENTION_SHOW_OVERLAY.key)) ===
      "true" || COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue

  if (audioTracker) {
    audioTracker.destroy?.()
  }

  audioTracker = new CognitiveAttentionAudioTracker({
    showOverlay,
    playbackThreshold: 3000, // 3 seconds of playback
    onSustainedAudioAttention: async (data) => {
      if (cachedAudioSummaries.has(data.src)) {
        const transcription = cachedAudioSummaries.get(data.src)
        drawSummary(data.audioElement, transcription)
        return
      }

      const loadingIndicator = showLoadingIndicator()

      async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return res
          } catch (err) {
            if (attempt === retries) throw err
            console.warn(
              `Fetch failed (attempt ${attempt + 1}), retrying...`,
              err
            )
            await new Promise((r) => setTimeout(r, delay * 2 ** attempt)) // exponential backoff
          }
        }
      }

      try {
        const audioResponse = await fetchWithRetry(data.src)
        await new Promise((r) => setTimeout(r, 100))

        const blob = await audioResponse.blob()
        const audioFile = new File([blob], "audio.mp3", {
          type: blob.type || "audio/mpeg"
        })

        const PROMPT = `Summarize this audio in one concise sentence (max 15 words).`

        const session = await getAudioModel()
        const summary = await session.prompt([
          {
            role: "user",
            content: [
              { type: "audio", value: audioFile },
              {
                type: "text",
                value: data.title
              },
              {
                type: "text",
                value: PROMPT.trim()
              }
            ]
          }
        ])
        await new Promise((r) => setTimeout(r, 100))
        session.destroy()

        cachedAudioSummaries.set(data.src, summary)
        loadingIndicator.remove()
        drawSummary(data.audioElement, summary)

        await sendToBackground({
          name: COGNITIVE_ATTENTION_AUDIO_MESSAGE_NAME,
          body: {
            url: URL,
            src: data.src,
            title: data.title,
            duration: data.duration,
            playbackDuration: data.playbackDuration,
            summary,
            timestamp: Date.now()
          }
        })
      } catch (error) {
        loadingIndicator.remove()
        console.error("Error generating transcription:", error)
      }
    }
  })

  audioTracker.init()
}

initAudioTracker().then(() => {
  storage.watch({
    [COGNITIVE_ATTENTION_SHOW_OVERLAY.key]: initAudioTracker
  })
})

export { audioTracker }

const showLoadingIndicator = (): HTMLElement => {
  const loadingId = "audio-transcription-loading"

  const existingLoading = document.getElementById(loadingId)
  if (existingLoading) {
    existingLoading.remove()
  }

  const loadingDiv = document.createElement("div")
  loadingDiv.id = loadingId
  loadingDiv.textContent = "Analyzing audio..."

  loadingDiv.style.position = "fixed"
  loadingDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
  loadingDiv.style.color = "white"
  loadingDiv.style.padding = "4px 8px"
  loadingDiv.style.borderRadius = "4px"
  loadingDiv.style.fontSize = "11px"
  loadingDiv.style.fontWeight = "500"
  loadingDiv.style.zIndex = "10000"
  loadingDiv.style.animation = "pulse 1.5s ease-in-out infinite"
  loadingDiv.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)"
  loadingDiv.style.pointerEvents = "none"

  // Position at bottom left with 10px margin
  loadingDiv.style.left = "10px"
  loadingDiv.style.bottom = "10px"

  if (!document.getElementById("pulse-animation-styles")) {
    const style = document.createElement("style")
    style.id = "pulse-animation-styles"
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 0.8;
        }
        50% {
          opacity: 0.5;
        }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(loadingDiv)

  return loadingDiv
}

const drawSummary = (audioElement: HTMLAudioElement, summary: string) => {
  const summaryId = "audio-summary-overlay"

  const existingSummary = document.getElementById(summaryId)
  if (existingSummary) {
    existingSummary.remove()
  }

  const summaryDiv = document.createElement("div")
  summaryDiv.id = summaryId
  summaryDiv.textContent = summary

  summaryDiv.style.position = "fixed"
  summaryDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
  summaryDiv.style.color = "white"
  summaryDiv.style.padding = "8px 12px"
  summaryDiv.style.borderRadius = "8px"
  summaryDiv.style.fontSize = "13px"
  summaryDiv.style.fontWeight = "500"
  summaryDiv.style.zIndex = "10000"
  summaryDiv.style.maxWidth = "300px"
  summaryDiv.style.wordWrap = "break-word"
  summaryDiv.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.3)"
  summaryDiv.style.cursor = "pointer"
  summaryDiv.style.lineHeight = "1.4"

  // Position at bottom left with 10px margin
  summaryDiv.style.left = "10px"
  summaryDiv.style.bottom = "10px"

  document.body.appendChild(summaryDiv)

  summaryDiv.onclick = () => {
    summaryDiv.remove()
  }
}
