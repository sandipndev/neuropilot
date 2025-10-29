import { createRoot } from "react-dom/client"
import { toast, Toaster } from "sonner"

import { Storage } from "@plasmohq/storage"

import {
  NOTIFICATION_STORAGE_KEY,
  NotificationMessageType
} from "~default-settings"

const storage = new Storage()

storage.watch({
  [NOTIFICATION_STORAGE_KEY]: ({ newValue }) => {
    console.log("Notification received", newValue)
    // Dismiss all existing toasts before showing the new one
    toast.dismiss()

    if (newValue.type === NotificationMessageType.DOOMSCROLLING_DETECTED) {
      toast("You are doomscrolling!")
    }
    if (newValue.type === NotificationMessageType.FOCUS_DRIFT_DETECTED) {
      toast("Your focus has drifted!")
    }
    if (newValue.type === NotificationMessageType.FOCUS_INACTIVITY_DETECTED) {
      toast("You are not focusing on anything!")
    }
  }
})

// Inject Toaster to body with custom styles
const toasterContainer = document.createElement("div")
toasterContainer.id = "sonner-toaster-container"
document.body.appendChild(toasterContainer)

const root = createRoot(toasterContainer)
root.render(
  <Toaster
    position="top-right"
    expand={false}
    richColors={false}
    closeButton={true}
    duration={4000}
    gap={12}
  />
)

// DO NOT REMOVE!!!
// let indx = 1
// setInterval(() => {
//   toast("Hello from background: " + indx++)
// }, 1000)
