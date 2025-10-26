import { sendToBackground } from "@plasmohq/messaging"

const WEBSITE_VISIT_MESSAGE_NAME = "website-visit"

type WebsiteVisitEventType = "opened" | "active-time-update" | "closed"

class WebsiteTracker {
  private active = false
  private activeTime = 0 // in ms
  private lastActiveAt = 0
  private tickInterval?: number
  private url = location.href

  start() {
    console.debug("[NP|WebsiteVisit] Tracking", this.url)
    this.emit("opened", {
      url: this.url,
      title: document.title,
      metadata: getWebsiteMetadata()
    })
    this.updateActivityState()

    const update = this.updateActivityState.bind(this)
    document.addEventListener("visibilitychange", update)
    window.addEventListener("focus", update)
    window.addEventListener("blur", update)
    window.addEventListener("beforeunload", this.handleClose)
  }

  private updateActivityState() {
    const shouldBeActive =
      document.visibilityState === "visible" && document.hasFocus()
    if (shouldBeActive && !this.active) {
      this.active = true
      this.lastActiveAt = Date.now()
      this.startTick()
    } else if (!shouldBeActive && this.active) {
      this.pauseTick()
    }
  }

  private startTick() {
    if (this.tickInterval) return
    this.tickInterval = window.setInterval(() => {
      const now = Date.now()
      this.activeTime += now - this.lastActiveAt
      this.lastActiveAt = now
      this.emit("active-time-update", { time: this.activeTime })
    }, 1000)
  }

  private pauseTick() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = undefined
    }
    this.activeTime += Date.now() - this.lastActiveAt
    this.active = false
  }

  private handleClose = () => {
    if (this.active) this.pauseTick()
    this.emit("closed", { url: this.url, time: this.activeTime })
  }

  private async emit(event: WebsiteVisitEventType, data: any = {}) {
    const body = {
      event,
      url: this.url,
      timestamp: Date.now(),
      ...data
    }

    console.debug(`[NP|WebsiteVisit] ${event}`, body)
    try {
      await sendToBackground({ name: WEBSITE_VISIT_MESSAGE_NAME, body })
    } catch (e) {
      console.warn("[NP|WebsiteVisit] emit failed:", e)
    }
  }
}

const getWebsiteMetadata = () => {
  const metaTags = document.querySelectorAll("meta")
  const metadata: Record<string, string> = {}

  for (const tag of metaTags) {
    const key =
      tag.getAttribute("name") ||
      tag.getAttribute("property") ||
      tag.getAttribute("itemprop")

    const value = tag.getAttribute("content")
    if (key && value) {
      metadata[key.trim()] = value.trim()
    }
  }

  // Also include <title> and canonical link for completeness
  const title = document.querySelector("title")?.innerText
  if (title) metadata["title"] = title

  const canonical = document
    .querySelector("link[rel='canonical']")
    ?.getAttribute("href")
  if (canonical) metadata["canonical"] = canonical

  return metadata
}

export default new WebsiteTracker().start()
