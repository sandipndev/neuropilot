export const getLanguageModel = async () => {
  const LanguageModel = (self as any).LanguageModel as any

  if (!LanguageModel) {
    throw new Error("Chrome AI not available")
  }

  if ((await LanguageModel.availability()) !== "available") {
    throw new Error("Language model not available")
  }

  return await LanguageModel.create()
}

export const getImageModel = async () => {
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
