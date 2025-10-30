import type { PlasmoMessaging } from "@plasmohq/messaging"

import db from "~db"

export type ImageAttention = {
  url: string
  src: string
  alt: string
  title: string
  width: number
  caption: string
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  await db.table<ImageAttention>("imageAttention").put({
    url: req.body.url,
    src: req.body.src,
    alt: req.body.alt,
    title: req.body.title,
    width: req.body.width,
    caption: req.body.caption,
    timestamp: req.body.timestamp
  })
}

export default handler
