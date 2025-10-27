/**
 * Image Upload Utilities
 * Validation, conversion, and cleanup for image uploads
 */

export interface ImageFile {
  file: File;
  id: string;
  preview: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Validate if file is a supported image type
 */
export function isValidImageFile(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];
  
  const maxSize = 5 * 1024 * 1024; // 5MB limit
  
  return supportedTypes.includes(file.type) && file.size <= maxSize;
}

/**
 * Get specific error message for invalid file
 */
export function getFileValidationError(file: File): string | null {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return `${file.name} is too large (max 5MB). Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];
  
  if (!supportedTypes.includes(file.type)) {
    return `${file.name} is not a supported image type. Supported: JPEG, PNG, GIF, WebP, BMP, SVG`;
  }
  
  return null;
}

/**
 * Create an ImageFile object from a File
 */
export function createImageFile(file: File): ImageFile {
  return {
    file,
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    preview: URL.createObjectURL(file),
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Clean up image preview URLs to prevent memory leaks
 */
export function cleanupImagePreview(imageFile: ImageFile): void {
  if (imageFile.preview) {
    URL.revokeObjectURL(imageFile.preview);
  }
}

/**
 * Clean up multiple image preview URLs
 */
export function cleanupImagePreviews(imageFiles: ImageFile[]): void {
  imageFiles.forEach(cleanupImagePreview);
}

/**
 * Convert File to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate and process dropped/selected files
 */
export function processFiles(
  files: File[],
  maxFiles: number = 1
): { valid: ImageFile[]; errors: string[] } {
  const valid: ImageFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (valid.length >= maxFiles) {
      errors.push(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
      break;
    }

    const error = getFileValidationError(file);
    if (error) {
      errors.push(error);
      continue;
    }

    valid.push(createImageFile(file));
  }

  return { valid, errors };
}
