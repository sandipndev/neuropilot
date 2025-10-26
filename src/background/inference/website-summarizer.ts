import db from "~background/db"
import type { WebsiteVisit } from "~background/messages/website-visit"

import { getLanguageModel } from "./model"

const PROMPT = (website: WebsiteVisit) => `
Summarize my activity for this website in a concise manner:

Title: ${website.title}
URL: ${website.url}
Active time: ${Math.round(website.active_time / 1000)}s

Provide a concise summary of what the website is.
`

const websiteSummarizerTask = async () => {
  await db.table<WebsiteVisit>("websiteVisits").each(async (website) => {
    if (website.summary) {
      return
    }

    const prompt = PROMPT(website).trim()
    const session = await getLanguageModel()
    const summary = await session.prompt(prompt)
    session.destroy()

    await db
      .table<WebsiteVisit>("websiteVisits")
      .where("url")
      .equals(website.url)
      .modify({
        summary,
        summary_generated_with_n_attentions: 1
      })
  })
}

export default websiteSummarizerTask
