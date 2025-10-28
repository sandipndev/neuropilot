import { type PlasmoMessaging } from "@plasmohq/messaging"

import db from "~db"

export type YoutubeAttention = {
  id: string
  title: string
  channelName: string
  caption?: string
  activeWatchTime?: number
  timestamp: number
}

const handler: PlasmoMessaging.MessageHandler = async (req) => {
  const event = req.body.event
  const data = req.body.data

  switch (event) {
    case "opened": {
      await db.table<YoutubeAttention>("youtubeAttention").put({
        id: req.body.videoId,
        title: data.title,
        channelName: data.channelName,
        timestamp: req.body.timestamp
      })
      break
    }
    case "caption": {
      const existing = await db
        .table<YoutubeAttention>("youtubeAttention")
        .where("id")
        .equals(req.body.videoId)
        .first()
      if (!existing) {
        return
      }

      if (existing.caption?.endsWith(data.caption)) {
        return
      }

      await db
        .table<YoutubeAttention>("youtubeAttention")
        .where("id")
        .equals(req.body.videoId)
        .modify({
          caption: `${existing.caption} ${data.caption}`,
          timestamp: req.body.timestamp
        })
      break
    }
    case "active-watch-time-update": {
      await db
        .table<YoutubeAttention>("youtubeAttention")
        .where("id")
        .equals(req.body.videoId)
        .modify({
          activeWatchTime: data.activeWatchTime,
          timestamp: req.body.timestamp
        })
      break
    }
  }
}

export default handler
