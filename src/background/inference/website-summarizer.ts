import type { ImageAttention } from "~background/messages/cognitive-attention-image"
import type { TextAttention } from "~background/messages/cognitive-attention-text"
import type { WebsiteVisit } from "~background/messages/website-visit"
import db from "~db"
import { getSummarizer } from "~model"

const DATA = (
  website: WebsiteVisit,
  textAttentions: TextAttention[],
  imageAttentions: ImageAttention[],
  n_attentions: number
) => `
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

    const data = DATA(
      website,
      textAttentions,
      imageAttentions,
      n_attentions
    ).trim()

    const prompt = `Summarize my activity for the given website in a concise manner
Provide a concise summary of what the website is and how I paid attention to it in a few words.`

    const summarizer = await getSummarizer("tldr")
    const summary = await summarizer.summarize(data, {
      context: prompt.trim()
    })
    summarizer.destroy()

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
