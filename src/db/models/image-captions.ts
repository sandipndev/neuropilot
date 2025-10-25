/**
 * Image Caption Model
 * Pure CRUD operations for image captions
 */

import { getDB } from "../index";
import { hashString } from "../utils/hash";

export interface ActivityUserAttentionImage {
  id: string;
  image_src: string;
  caption: string;
  alt_text: string;
  title: string;
  timestamp: number;
}

/**
 * Save an image caption
 */
export async function saveImageCaption(data: {
  image_src: string;
  caption: string;
  alt_text?: string;
  title?: string;
}): Promise<void> {
  const db = await getDB();
  const now = Date.now();

  const imageCaption: ActivityUserAttentionImage = {
    id: await hashString(data.image_src + now.toString()),
    image_src: data.image_src,
    caption: data.caption,
    alt_text: data.alt_text || "",
    title: data.title || "",
    timestamp: now,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttentionImage"], "readwrite");
    const store = transaction.objectStore("ActivityUserAttentionImage");

    const request = store.put(imageCaption);

    request.onsuccess = () => {
      console.debug(`Saved image caption for: ${data.image_src}`);
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to save image caption: ${request.error?.message}`));
    };

    transaction.onerror = () => {
      reject(new Error(`Transaction failed: ${transaction.error?.message}`));
    };
  });
}

/**
 * Get caption for a specific image by src
 */
export async function getImageCaptionBySrc(imageSrc: string): Promise<ActivityUserAttentionImage | null> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttentionImage"], "readonly");
    const store = transaction.objectStore("ActivityUserAttentionImage");
    const index = store.index("image_src");
    const request = index.get(imageSrc);

    request.onsuccess = () => {
      resolve(request.result as ActivityUserAttentionImage | null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get image caption: ${request.error?.message}`));
    };
  });
}

/**
 * Get all image captions
 */
export async function getAllImageCaptions(): Promise<ActivityUserAttentionImage[]> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttentionImage"], "readonly");
    const store = transaction.objectStore("ActivityUserAttentionImage");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as ActivityUserAttentionImage[]);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get image captions: ${request.error?.message}`));
    };
  });
}

/**
 * Delete image caption by src
 */
export async function deleteImageCaption(imageSrc: string): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttentionImage"], "readwrite");
    const store = transaction.objectStore("ActivityUserAttentionImage");
    const index = store.index("image_src");
    const getRequest = index.getKey(imageSrc);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const deleteRequest = store.delete(getRequest.result);

        deleteRequest.onsuccess = () => {
          resolve();
        };

        deleteRequest.onerror = () => {
          reject(new Error(`Failed to delete image caption: ${deleteRequest.error?.message}`));
        };
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => {
      reject(new Error(`Failed to find image caption: ${getRequest.error?.message}`));
    };
  });
}

/**
 * Clear all image captions
 */
export async function clearAllImageCaptions(): Promise<void> {
  const db = await getDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["ActivityUserAttentionImage"], "readwrite");
    const store = transaction.objectStore("ActivityUserAttentionImage");

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear image captions: ${request.error?.message}`));
    };
  });
}
