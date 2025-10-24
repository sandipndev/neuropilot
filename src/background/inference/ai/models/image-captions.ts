/**
 * Image Caption Model
 * Uses Gemini Nano's multimodal capabilities to generate image captions
 */

export interface ImageCaptionSession {
  session: any;
  destroy: () => void;
}

/**
 * Get vision-enabled language model for image captioning
 */
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

/**
 * Generate caption for an image using Gemini Nano
 */
export const generateCaption = async (imageFile: File): Promise<string> => {
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
    return caption.trim();
  } finally {
    model.destroy();
  }
};
