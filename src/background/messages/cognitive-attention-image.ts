import type { PlasmoMessaging } from "@plasmohq/messaging"

import db from "~background/db"

export type ImageAttention = {
  url: string
  src: string
  alt: string
  title: string
  width: number
  caption: string
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  await db.table<ImageAttention>("imageAttention").put({
    url: req.body.url,
    src: req.body.src,
    alt: req.body.alt,
    title: req.body.title,
    width: req.body.width,
    caption: req.body.caption
  })
}

export default handler
