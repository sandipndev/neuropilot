import { Storage } from "@plasmohq/storage"

import { NOTIFICATION_STORAGE_KEY } from "~default-settings"

const storage = new Storage()

storage.watch({
  [NOTIFICATION_STORAGE_KEY]: ({ newValue }) => {
    console.log("Notification received", newValue)
    if (newValue) {
      // TODO
    }
  }
})
