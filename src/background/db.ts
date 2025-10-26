import { Dexie } from "dexie"

const db = new Dexie("Neuropilot")

db.version(1).stores({
  // User Activity
  websiteVisits: "&url",
  textAttention: "++id, url, timestamp",
  imageAttention: "++id, url, timestamp"
})

export default db
