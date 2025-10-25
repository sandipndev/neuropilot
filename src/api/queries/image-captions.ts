/**
 * API Query: Image Captions
 * Business logic for image caption generation and retrieval
 */

import { generateCaption } from "../../background/inference/ai/models/image-captions";
import {
  saveImageCaption,
  getImageCaptionBySrc,
  getAllImageCaptions,
  type ActivityUserAttentionImage,
} from "../../db/models/image-captions";


export async function generateAndSaveImageCaption(
  imageSrc: string,
  imageFile: File,
  altText?: string,
  title?: string
): Promise<string> {
  const existing = await getImageCaptionBySrc(imageSrc);
  if (existing) {
    return existing.caption;
  }

  const caption = await generateCaption(imageFile, imageSrc);

  await saveImageCaption({
    image_src: imageSrc,
    caption,
    alt_text: altText,
    title,
  });

  return caption;
}

export async function getOrGenerateCaption(
  imageSrc: string,
  imageFile: File,
  altText?: string,
  title?: string
): Promise<ActivityUserAttentionImage> {
  const cached = await getImageCaptionBySrc(imageSrc);
  if (cached) {
    return cached;
  }

  await generateAndSaveImageCaption(imageSrc, imageFile, altText, title);

  const newCaption = await getImageCaptionBySrc(imageSrc);
  if (!newCaption) {
    throw new Error("Failed to retrieve saved caption");
  }

  return newCaption;
}

export async function getCachedActivityUserAttentionImageCaptions(): Promise<ActivityUserAttentionImage[]> {
  return await getAllImageCaptions();
}
