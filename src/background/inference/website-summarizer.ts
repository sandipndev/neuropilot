import db from "~background/db"
import type { ImageAttention } from "~background/messages/cognitive-attention-image"
import type { TextAttention } from "~background/messages/cognitive-attention-text"
import type { WebsiteVisit } from "~background/messages/website-visit"
import { getLanguageModel } from "~model"

const PROMPT = (
  website: WebsiteVisit,
  textAttentions: TextAttention[],
  imageAttentions: ImageAttention[],
  n_attentions: number
) => `
Summarize my activity for this website in a concise manner:

Title: ${website.title}
URL: ${website.url}

${n_attentions > 0 && "Content the user paid attention to:"}
${textAttentions.map((ta) => ta.text).join("\n")}
${
  imageAttentions.length > 0
    ? `Image Descriptions the user paid attention to:
${imageAttentions.map((ia) => ia.caption).join("\n")}`
    : ""
}

Provide a concise summary of what the website is and how I paid attention to it in a few words.
`

const websiteSummarizerTask = async () => {
  const websites = await db.table<WebsiteVisit>("websiteVisits").toArray()
  for (const website of websites) {
    const textAttentions = await db
      .table<TextAttention>("textAttention")
      .where("url")
      .equals(website.url)
      .toArray()

    const imageAttentions = await db
      .table<ImageAttention>("imageAttention")
      .where("url")
      .equals(website.url)
      .toArray()

    const n_attentions = textAttentions.length + imageAttentions.length

    if (
      website.summary_generated_with_n_attentions &&
      website.summary_generated_with_n_attentions <= n_attentions
    ) {
      continue
    }

    const prompt = PROMPT(
      website,
      textAttentions,
      imageAttentions,
      n_attentions
    ).trim()
    const session = await getLanguageModel()
    const summary = await session.prompt(prompt)
    session.destroy()

    await db
      .table<WebsiteVisit>("websiteVisits")
      .where("url")
      .equals(website.url)
      .modify({
        summary,
        summary_generated_with_n_attentions: n_attentions
      })
  }
}

export default websiteSummarizerTask
