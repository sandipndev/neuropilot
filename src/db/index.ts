/**
 * Database layer using IndexedDB
 */

const DB_NAME = "NeuroPilotDB";
const DB_VERSION = 10;

let dbInstance: IDBDatabase | null = null;

export async function initDB(dbName = DB_NAME, dbVersion = DB_VERSION): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = (err) => {
      console.error("Database error:", err);
      console.error("Request error:", request.error);
      reject(new Error(`Failed to open database: ${request.error?.message || "Unknown error"}`));
    };

    request.onblocked = () => {
      console.warn("Database upgrade blocked. Please close all other tabs using this extension.");
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

      // ActivityUserAttentionImage table
      if (!db.objectStoreNames.contains("ActivityUserAttentionImage")) {
        const imageCaptionStore = db.createObjectStore("ActivityUserAttentionImage", {
          keyPath: "id",
        });
        imageCaptionStore.createIndex("image_src", "image_src", { unique: false });
        imageCaptionStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // QuizQuestions table
      if (!db.objectStoreNames.contains("QuizQuestions")) {
        const quizStore = db.createObjectStore("QuizQuestions", {
          keyPath: "id",
        });
        quizStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // ActivitySummary table
      if (!db.objectStoreNames.contains("ActivitySummary")) {
        const activitySummaryStore = db.createObjectStore("ActivitySummary", {
          keyPath: "id",
        });
        activitySummaryStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Pomodoro table
      if (!db.objectStoreNames.contains("Pomodoro")) {
        db.createObjectStore("Pomodoro", {
          keyPath: "id",
        });
      }

      // PastWins table
      if (!db.objectStoreNames.contains("PastWins")) {
        const pastWinsStore = db.createObjectStore("PastWins", {
          keyPath: "id",
        });
        pastWinsStore.createIndex("recorded_at", "recorded_at", { unique: false });
        pastWinsStore.createIndex("focus_item", "focus_item", { unique: false });
      }

      // ChatMessages table
      if (!db.objectStoreNames.contains("ChatMessages")) {
        const chatStore = db.createObjectStore("ChatMessages", {
          keyPath: "id",
        });
        chatStore.createIndex("timestamp", "timestamp", { unique: false });
        chatStore.createIndex("role", "role", { unique: false });
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
