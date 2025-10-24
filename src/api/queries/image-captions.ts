/**
 * API Query: Image Captions
 * Business logic for image caption generation and retrieval
 */

import { generateCaption } from "../../background/inference/ai/models/image-captions";
import {
  saveImageCaption,
  getImageCaptionBySrc,
  getAllImageCaptions,
  type ImageCaption,
} from "../../db/models/image-captions";

/**
 * Generate and save caption for an image
 */
export async function generateAndSaveImageCaption(
  imageSrc: string,
  imageFile: File,
  altText?: string,
  title?: string
): Promise<string> {
  // Check if caption already exists
  const existing = await getImageCaptionBySrc(imageSrc);
  if (existing) {
    return existing.caption;
  }

  // Generate new caption using AI
  const caption = await generateCaption(imageFile);

  // Save to database
  await saveImageCaption({
    image_src: imageSrc,
    caption,
    alt_text: altText,
    title,
  });

  return caption;
}

/**
 * Get caption for an image (from cache or generate new)
 */
export async function getOrGenerateCaption(
  imageSrc: string,
  imageFile: File,
  altText?: string,
  title?: string
): Promise<ImageCaption> {
  // Try to get from cache first
  const cached = await getImageCaptionBySrc(imageSrc);
  if (cached) {
    return cached;
  }

  // Generate and save new caption
  const caption = await generateAndSaveImageCaption(imageSrc, imageFile, altText, title);

  // Return the newly created caption
  const newCaption = await getImageCaptionBySrc(imageSrc);
  if (!newCaption) {
    throw new Error("Failed to retrieve saved caption");
  }

  return newCaption;
}

/**
 * Get all cached image captions
 */
export async function getCachedImageCaptions(): Promise<ImageCaption[]> {
  return await getAllImageCaptions();
}
