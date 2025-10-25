/**
 * Image Caption Request Handler
 * Handles image caption generation requests from content scripts
 */

import { generateAndSaveImageCaption } from "../../api/queries/image-captions";

export async function handleImageCaptionRequest(data: any): Promise<{ caption: string }> {
  const { src, alt, title, imageData, mimeType } = data;

  if (!src || !imageData) {
    throw new Error("Missing required fields: src or imageData");
  }

  // Convert base64 back to File
  const base64Response = await fetch(imageData);
  const blob = await base64Response.blob();
  const imageFile = new File([blob], "image.jpg", { type: mimeType || "image/jpeg" });

  // Generate and save caption
  const caption = await generateAndSaveImageCaption(src, imageFile, alt, title);

  return { caption };
}
