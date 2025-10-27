import type { ImageAttention } from "~background/messages/cognitive-attention-image"
import type { TextAttention } from "~background/messages/cognitive-attention-text"
import type { WebsiteVisit } from "~background/messages/website-visit"
import db from "~db"

export interface UserActivity extends WebsiteVisit {
  textAttentions: TextAttention[]
  imageAttentions: ImageAttention[]
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

  return websites.map((website) => ({
    ...website,
    textAttentions: textAttentions.filter((ta) => ta.url === website.url),
    imageAttentions: imageAttentions.filter((ia) => ia.url === website.url)
  }))
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
`
    )
    .join("\n\n---\n\n")
