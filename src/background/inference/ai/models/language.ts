export const getLanguageModel = async () => {
  const LanguageModel = (self as any).LanguageModel as any;

  if (!LanguageModel) {
    throw new Error("Chrome AI not available");
  }

  if ((await LanguageModel.availability()) !== "available") {
    throw new Error("Language model not available");
  }

  return await LanguageModel.create();
};
