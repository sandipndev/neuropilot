import type { PlasmoMessaging } from "@plasmohq/messaging"

import db from "~db"

export type AudioAttention = {
  url: string
  src: string
  title: string
  duration: number
  summary: string
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  const { url, src, title, duration, summary, timestamp } =
    req.body as AudioAttention

  await db.table<AudioAttention>("audioAttention").add({
    url,
    src,
    title,
    duration,
    summary,
    timestamp
  })
}

export default handler
