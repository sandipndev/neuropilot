import { Storage } from "@plasmohq/storage"

import type { AudioAttention } from "~background/messages/cognitive-attention-audio"
import type { ImageAttention } from "~background/messages/cognitive-attention-image"
import type { TextAttention } from "~background/messages/cognitive-attention-text"
import type { WebsiteVisit } from "~background/messages/website-visit"
import type { YoutubeAttention } from "~background/messages/youtube-attention"
import type { Focus } from "~db"
import db from "~db"
import {
  NOTIFICATION_STORAGE_KEY,
  type NotificationMessageType
} from "~default-settings"

export const getActiveFocus = async () =>
  (await db.table<Focus>("focus").reverse().toArray()).find((focus) => {
    const lastTimeEntry = focus.time_spent[focus.time_spent.length - 1]
    return lastTimeEntry && lastTimeEntry.end === null
  })

export interface UserActivity extends WebsiteVisit {
  textAttentions: TextAttention[]
  imageAttentions: ImageAttention[]
  youtubeAttentions: YoutubeAttention[]
  audioAttentions: AudioAttention[]
}

export const allUserActivityForLastMs = async (
  ms: number
): Promise<UserActivity[]> => {
  const websites = await db
    .table<WebsiteVisit>("websiteVisits")
    .where("opened_at")
    .above(Date.now() - ms)
    .toArray()

  const textAttentions = await db
    .table<TextAttention>("textAttention")
    .where("timestamp")
    .above(Date.now() - ms)
    .toArray()

  const imageAttentions = await db
    .table<ImageAttention>("imageAttention")
    .where("timestamp")
    .above(Date.now() - ms)
    .toArray()

  const youtubeAttentions = await db
    .table<YoutubeAttention>("youtubeAttention")
    .where("timestamp")
    .above(Date.now() - ms)
    .toArray()

  const audioAttentions = await db
    .table<AudioAttention>("audioAttention")
    .where("timestamp")
    .above(Date.now() - ms)
    .toArray()

  return websites
    .map((website) => {
      const websiteTextAttentions = textAttentions.filter(
        (ta) => ta.url === website.url
      )
      const websiteImageAttentions = imageAttentions.filter(
        (ia) => ia.url === website.url
      )
      const websiteYoutubeAttentions = youtubeAttentions.filter((ya) =>
        website.url.includes(ya.id)
      )

      const websiteAudioAttentions = audioAttentions.filter((aa) =>
        website.url.includes(aa.src)
      )

      // Find the latest activity timestamp for this website
      const latestActivity = Math.max(
        website.closed_at || website.opened_at,
        website.active_time || 0,
        ...websiteTextAttentions.map((ta) => ta.timestamp),
        ...websiteImageAttentions.map((ia) => ia.timestamp),
        ...websiteYoutubeAttentions.map((ya) => ya.timestamp),
        ...websiteAudioAttentions.map((aa) => aa.timestamp)
      )

      return {
        ...website,
        textAttentions: websiteTextAttentions,
        imageAttentions: websiteImageAttentions,
        youtubeAttentions: websiteYoutubeAttentions,
        audioAttentions: websiteAudioAttentions,
        latestActivity
      }
    })
    .sort((a, b) => b.latestActivity - a.latestActivity)
}

export const attentionContent = (recentActivity: UserActivity[]) =>
  recentActivity
    .map(
      (a, index) => `
Title ${index + 1}: ${a.title}
URL ${index + 1}: ${a.url}
Content ${index + 1} user is paying attention to in this page:
${a.textAttentions.map((r) => r.text).join(" ")}
${
  a.imageAttentions.length > 0
    ? `Image Descriptions ${index + 1} user is paying attention to in this page:
${a.imageAttentions.map((r) => r.caption).join(" ")}`
    : ""
}
${
  a.youtubeAttentions.length > 0
    ? `Youtube Videos ${index + 1} user is paying attention to in this page:
${a.youtubeAttentions
  .map(
    (r) => `
Title: ${r.title}
Channel Name: ${r.channelName}
Captions read by the User: ${r.caption}
Active Watch Time: ${r.activeWatchTime}
`
  )
  .join(" ")}`
    : ""
}
${
  a.audioAttentions.length > 0
    ? `Audio Summaries ${index + 1} user is paying attention to in this page:
${a.audioAttentions.map((r) => r.summary).join(" ")}`
    : ""
}
`
    )
    .join("\n\n---\n\n")

const storage = new Storage()

export const sendNotification = async (
  notificationType: NotificationMessageType,
  lastNotificationKey: string,
  cooldownMs: number = 60000
): Promise<void> => {
  const lastNotificationTime = await storage.get(lastNotificationKey)
  const now = Date.now()

  if (
    !lastNotificationTime ||
    now - Number(lastNotificationTime) >= cooldownMs
  ) {
    await storage.set(NOTIFICATION_STORAGE_KEY, {
      type: notificationType,
      timestamp: now
    })
    await storage.set(lastNotificationKey, now)
  }
}
