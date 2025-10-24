const PROMPT = `
You are checking if the user’s attention has changed from their previous topic.

Previous focus: Bitcoin
Previous keywords: Bitcoin Whitepaper, Bitcoin Fintech

Current attention:
https://bitcoin.design - Daily spending wallet The daily spending wallet is an app designed to quickly and easily send small amounts of bitcoin

Question:
Does the current attention clearly belong to a different subject (for example, moving from tech to cooking or fashion)?
Or is it still about the same general topic or subtopic?

If it is even related or still part of the same domain then answer no (still focused). Otherwise, if you don't find a relation between the previous focus and current attentions, then answer yes (shifted)

Answer in one word (yes/no) only, no reasoning.`;
