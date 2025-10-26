import { Dexie } from "dexie"

const db = new Dexie("Neuropilot")

db.version(1).stores({
  // User Activity
  websiteVisits: "&url"
})

export default db
