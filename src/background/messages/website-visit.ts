import type { PlasmoMessaging } from "@plasmohq/messaging"

import db from "~db"

export type WebsiteVisit = {
  url: string
  title: string
  metadata: Record<string, string>
  opened_at: number
  closed_at: number | null
  active_time: number
  referrer: string | null
  summary?: string
  summary_generated_with_n_attentions?: number
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  const body = req.body
  switch (body.event) {
    case "opened": {
      await db.table<WebsiteVisit>("websiteVisits").put({
        url: body.url,
        title: body.title,
        metadata: body.metadata,
        opened_at: body.timestamp,
        referrer: body.url === body.referrer ? null : body.referrer,
        closed_at: null,
        active_time: 0
      })
      break
    }
    case "active-time-update": {
      await db
        .table<WebsiteVisit>("websiteVisits")
        .where("url")
        .equals(body.url)
        .modify({
          active_time: body.time
        })
      break
    }
    case "closed": {
      await db
        .table<WebsiteVisit>("websiteVisits")
        .where("url")
        .equals(body.url)
        .modify({
          closed_at: body.timestamp
        })
      break
    }
  }
}

export default handler
