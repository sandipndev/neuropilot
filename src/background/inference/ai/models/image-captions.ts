/**
 * Image Caption Model
 * Uses Gemini Nano's multimodal capabilities to generate image captions
 */

export interface ImageCaptionSession {
  session: any;
  destroy: () => void;
}

// In-memory cache for image captions (key: image src URL, value: caption)
const captionCache = new Map<string, string>();

export const getImageCaptionModel = async (): Promise<ImageCaptionSession> => {
  const LanguageModel = (self as any).LanguageModel as any;

  if (!LanguageModel) {
    throw new Error("Chrome AI not available");
  }

  const availability = await LanguageModel.availability({
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }],
  });

  if (availability !== "available") {
    throw new Error(`Image processing not available: ${availability}`);
  }

  const session = await LanguageModel.create({
    expectedInputs: [{ type: "image" }, { type: "text" }],
    expectedOutputs: [{ type: "text" }],
    systemPrompt: "You are an image captioning assistant. Generate brief, descriptive captions.",
  });

  return {
    session,
    destroy: () => {
      if (session.destroy) {
        session.destroy();
      }
    },
  };
};


export const generateCaption = async (imageFile: File, imageSrc?: string): Promise<string> => {
  if (imageSrc && captionCache.has(imageSrc)) {
    console.debug(`[Image Caption Cache] Hit for: ${imageSrc}`);
    return captionCache.get(imageSrc)!;
  }

  const model = await getImageCaptionModel();

  try {
    await model.session.append([
      {
        role: "user",
        content: [
          { type: "image", value: imageFile },
          { type: "text", value: "Describe this image in one concise sentence (max 15 words)." },
        ],
      },
    ]);

    const caption = await model.session.prompt("");
    const trimmedCaption = caption.trim();

    if (imageSrc) {
      captionCache.set(imageSrc, trimmedCaption);
      console.debug(`[Image Caption Cache] Stored for: ${imageSrc}`);
    }

    return trimmedCaption;
  } finally {
    model.destroy();
  }
};


export const clearCaptionCache = (): void => {
  captionCache.clear();
  console.debug("[Image Caption Cache] Cleared");
};

export const getCacheSize = (): number => {
  return captionCache.size;
};
