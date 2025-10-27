import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import { COGNITIVE_ATTENTION_SHOW_OVERLAY } from "~default-settings"
import { getImageModel } from "~model"

import CognitiveAttentionImageTracker from "../cognitive-attention/monitor-image"

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
      }

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
              value: PROMPT.trim()
            }
          ]
        }
      ])
      session.destroy()

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

const drawCaption = (imageElement: HTMLImageElement, caption: string) => {
  const captionId = "image-caption-overlay"

  // Check if caption already exists and remove it
  const existingCaption = document.getElementById(captionId)
  if (existingCaption) {
    existingCaption.remove()
  }

  // Create caption element
  const captionDiv = document.createElement("div")
  captionDiv.id = captionId
  captionDiv.textContent = caption

  // Style the caption
  captionDiv.style.position = "absolute"
  captionDiv.style.backgroundColor = "black"
  captionDiv.style.color = "white"
  captionDiv.style.padding = "8px 12px"
  captionDiv.style.width = imageElement.offsetWidth + "px"
  captionDiv.style.boxSizing = "border-box"
  captionDiv.style.textAlign = "center"
  captionDiv.style.fontSize = "14px"

  // Position it under the image
  const rect = imageElement.getBoundingClientRect()
  captionDiv.style.left = rect.left + window.scrollX + "px"
  captionDiv.style.top = rect.bottom + window.scrollY + "px"

  captionDiv.onclick = () => {
    document.body.removeChild(captionDiv)
  }

  // Add to document
  document.body.appendChild(captionDiv)
}
