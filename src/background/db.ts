import { Dexie } from "dexie"

const db = new Dexie("Neuropilot")

db.version(1).stores({
  // User Activity
  websiteVisits: "&url, opened_at",
  textAttention: "++id, url, timestamp",
  imageAttention: "++id, url, timestamp",

  // Inference Results
  focus: "++id, last_updated",
  pulse: "++id"
})

export default db
