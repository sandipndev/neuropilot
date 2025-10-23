/**
 * Database layer using IndexedDB
 */

const DB_NAME = "NeuroPilotDB";
const DB_VERSION = 1;

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
