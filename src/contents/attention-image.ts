import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import { COGNITIVE_ATTENTION_SHOW_OVERLAY } from "~default-settings"

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

      const session = await getImageModel()
      const caption = await session.prompt([
        {
          role: "user",
          content: [
            { type: "image", value: imageFile },
            {
              type: "text",
              value:
                "Describe this image in one concise sentence (max 15 words)."
            }
          ]
        }
      ])

      drawCaption(data.imageElement, caption)
      await sendToBackground({
        name: COGNITIVE_ATTENTION_IMAGE_MESSAGE_NAME,
        body: {
          url: URL,
          src: data.src,
          alt: data.alt,
          title: data.title,
          width: data.width,
          caption
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

const getImageModel = async () => {
  const LanguageModel = (self as any).LanguageModel as any

  if (!LanguageModel) {
    throw new Error("Chrome AI not available")
  }

  const availability = await LanguageModel.availability({
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }]
  })

  if (availability !== "available") {
    throw new Error(`Image processing not available: ${availability}`)
  }

  return await LanguageModel.create({
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }],
    systemPrompt:
      "You are an image captioning assistant. Generate brief, descriptive captions."
  })
}

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

  // Add to document
  document.body.appendChild(captionDiv)
}
