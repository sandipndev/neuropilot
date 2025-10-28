import { type PlasmoCSConfig } from "plasmo"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import { COGNITIVE_ATTENTION_SHOW_OVERLAY } from "~default-settings"
import { getImageModel } from "~model"

import CognitiveAttentionImageTracker from "../cognitive-attention/monitor-image"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: ["*://*.youtube.com/*"],
  all_frames: false
}

const COGNITIVE_ATTENTION_IMAGE_MESSAGE_NAME = "cognitive-attention-image"

const storage = new Storage()
let imageTracker: CognitiveAttentionImageTracker | null = null

const URL = location.href

const cachedImageCaptions = new Map<string, string>()

const initImageTracker = async () => {
  const showOverlay =
    String(await storage.get(COGNITIVE_ATTENTION_SHOW_OVERLAY.key)) ===
      "true" || COGNITIVE_ATTENTION_SHOW_OVERLAY.defaultValue

  if (imageTracker) {
    imageTracker.destroy?.()
  }

  imageTracker = new CognitiveAttentionImageTracker({
    showOverlay,
    onSustainedImageAttention: async (data) => {
      if (cachedImageCaptions.has(data.src)) {
        const caption = cachedImageCaptions.get(data.src)
        drawCaption(data.imageElement, caption)
        return
      }

      // Show loading indicator
      const loadingIndicator = showLoadingIndicator(data.imageElement)

      try {
        const base64Response = await fetch(data.base64)
        const blob = await base64Response.blob()
        const imageFile = new File([blob], "image.jpg", {
          type: data.mimeType || "image/jpeg"
        })

        const PROMPT = `Describe this image in one concise sentence (max 15 words).`

        const session = await getImageModel()
        const caption = await session.prompt([
          {
            role: "user",
            content: [
              { type: "image", value: imageFile },
              {
                type: "text",
                value: data.alt
              },
              {
                type: "text",
                value: PROMPT.trim()
              }
            ]
          }
        ])
        session.destroy()

        cachedImageCaptions.set(data.src, caption)

        loadingIndicator.remove()

        drawCaption(data.imageElement, caption)

        await sendToBackground({
          name: COGNITIVE_ATTENTION_IMAGE_MESSAGE_NAME,
          body: {
            url: URL,
            src: data.src,
            alt: data.alt,
            title: data.title,
            width: data.width,
            caption,
            timestamp: Date.now()
          }
        })
      } catch (error) {
        loadingIndicator.remove()
        console.error("Error generating caption:", error)
      }
    }
  })

  imageTracker.init()
}

initImageTracker().then(() => {
  storage.watch({
    [COGNITIVE_ATTENTION_SHOW_OVERLAY.key]: initImageTracker
  })
})

export { imageTracker }

const showLoadingIndicator = (imageElement: HTMLImageElement): HTMLElement => {
  const loadingId = "image-caption-loading"

  const existingLoading = document.getElementById(loadingId)
  if (existingLoading) {
    existingLoading.remove()
  }

  const loadingDiv = document.createElement("div")
  loadingDiv.id = loadingId

  loadingDiv.style.position = "fixed"
  loadingDiv.style.width = "8px"
  loadingDiv.style.height = "8px"
  loadingDiv.style.borderRadius = "50%"
  loadingDiv.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
  loadingDiv.style.zIndex = "10000"
  loadingDiv.style.animation = "pulse 1.5s ease-in-out infinite"
  loadingDiv.style.boxShadow =
    "0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 8px rgba(0, 0, 0, 0.6)"

  if (!document.getElementById("pulse-animation-styles")) {
    const style = document.createElement("style")
    style.id = "pulse-animation-styles"
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.4);
        }
      }
    `
    document.head.appendChild(style)
  }

  const updatePosition = () => {
    const rect = imageElement.getBoundingClientRect()
    loadingDiv.style.left = rect.right - 16 + "px"
    loadingDiv.style.top = rect.bottom - 16 + "px"
  }

  updatePosition()

  const resizeHandler = () => updatePosition()
  const scrollHandler = () => updatePosition()

  window.addEventListener("resize", resizeHandler)
  window.addEventListener("scroll", scrollHandler, true)
  ;(loadingDiv as any)._cleanup = () => {
    window.removeEventListener("resize", resizeHandler)
    window.removeEventListener("scroll", scrollHandler, true)
  }

  const originalRemove = loadingDiv.remove.bind(loadingDiv)
  loadingDiv.remove = () => {
    ;(loadingDiv as any)._cleanup?.()
    originalRemove()
  }

  document.body.appendChild(loadingDiv)
  return loadingDiv
}

const drawCaption = (imageElement: HTMLImageElement, caption: string) => {
  const captionId = "image-caption-overlay"

  const existingCaption = document.getElementById(captionId)
  if (existingCaption) {
    existingCaption.remove()
  }

  const captionDiv = document.createElement("div")
  captionDiv.id = captionId
  captionDiv.textContent = caption

  captionDiv.style.position = "fixed"
  captionDiv.style.backgroundColor = "black"
  captionDiv.style.color = "white"
  captionDiv.style.padding = "8px 12px"
  captionDiv.style.boxSizing = "border-box"
  captionDiv.style.textAlign = "center"
  captionDiv.style.fontSize = "14px"
  captionDiv.style.zIndex = "10000"

  const updatePosition = () => {
    const rect = imageElement.getBoundingClientRect()
    captionDiv.style.left = rect.left + "px"
    captionDiv.style.top = rect.bottom + "px"
    captionDiv.style.width = rect.width + "px"
  }

  updatePosition()
  window.addEventListener("resize", updatePosition)
  window.addEventListener("scroll", updatePosition, true)

  captionDiv.onclick = () => {
    window.removeEventListener("resize", updatePosition)
    window.removeEventListener("scroll", updatePosition, true)
    document.body.removeChild(captionDiv)
  }

  document.body.appendChild(captionDiv)
}
