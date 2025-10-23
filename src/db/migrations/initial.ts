/**
 * Initial database migration
 * Sets up all the tables for NeuroPilot
 */

export function runInitialMigration(db: IDBDatabase): void {
  // ActivityUserAttention table
  if (!db.objectStoreNames.contains("ActivityUserAttention")) {
    const attentionStore = db.createObjectStore("ActivityUserAttention", {
      keyPath: "id",
    });
    attentionStore.createIndex("text_content", "timestamp", { unique: false });
  }
}
