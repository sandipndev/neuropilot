/**
 * Database layer using IndexedDB
 */

const DB_NAME = "NeuroPilotDB";
const DB_VERSION = 6;

let dbInstance: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ActivityUserAttention table
      if (!db.objectStoreNames.contains("ActivityUserAttention")) {
        const attentionStore = db.createObjectStore("ActivityUserAttention", {
          keyPath: "id",
        });
        attentionStore.createIndex("timestamp", "timestamp", { unique: false });
        attentionStore.createIndex("website_id", "website_id", { unique: false });
      }

      // ActivityWebsitesVisited table
      if (!db.objectStoreNames.contains("ActivityWebsitesVisited")) {
        const websiteStore = db.createObjectStore("ActivityWebsitesVisited", {
          keyPath: "id",
        });
        websiteStore.createIndex("timestamp", "timestamp", { unique: false });
        websiteStore.createIndex("url", "url", { unique: false });
      }

      // Focus table
      if (!db.objectStoreNames.contains("Focus")) {
        const focusStore = db.createObjectStore("Focus", {
          keyPath: "id",
        });
        focusStore.createIndex("focus_item", "focus_item", { unique: false });
        focusStore.createIndex("last_updated", "last_updated", { unique: false });
      }

      // Pulse table
      if (!db.objectStoreNames.contains("Pulse")) {
        const pulseStore = db.createObjectStore("Pulse", {
          keyPath: "id",
        });
        pulseStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // ImageCaption table
      if (!db.objectStoreNames.contains("ImageCaption")) {
        const imageCaptionStore = db.createObjectStore("ImageCaption", {
          keyPath: "id",
        });
        imageCaptionStore.createIndex("image_src", "image_src", { unique: false });
        imageCaptionStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

export async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return initDB();
  }
  return dbInstance;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
