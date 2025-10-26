import type { PlasmoMessaging } from "@plasmohq/messaging"

import db from "~background/db"

export type TextAttention = {
  url: string
  text: string
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  const url = req.body.url
  const text = req.body.text
  const timestamp = req.body.timestamp

  await db.table<TextAttention>("textAttention").put({
    url,
    text,
    timestamp
  })
}

export default handler
