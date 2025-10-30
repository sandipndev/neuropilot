# NeuroPilot

Your AI co-pilot for focused learning on the web.

NeuroPilot is a Chrome extension that turns scattered browsing into genuine learning. It runs quietly in the background, tracking what you actually pay attention to — the content you read, the figures you study, the videos you watch — and uses Chrome's built-in AI to help you stay focused, remember what matters, and test your understanding.

## What It Does

As you browse, NeuroPilot notices where your attention settles and gradually turns that native attention into learning. When your focus slips, it offers gentle nudges to bring you back. When you finish reading or watching something, it surfaces quick recall prompts to reinforce what you just absorbed. It occasionally slips in short, well-timed quizzes to check your understanding while the idea is still fresh. And when you want to go deeper, its context-aware chat remembers where you've been, helping you connect ideas and build knowledge over time.

Everything runs on-device using Chrome's built-in AI (powered by Gemini Nano). Your data stays private. No servers, no tracking, no cloud uploads.

## Features

- **Attention Tracking**: Monitors what you actually read, watch, and explore — not just time spent on tabs
- **Focus Sessions**: Understands the broader themes you're learning about across multiple pages
- **Gentle Nudges**: Small reminders when your attention starts to drift
- **Recall Prompts**: Quick questions that help reinforce what you just learned
- **Context-Aware Chat**: Ask questions and get answers based on what you've been exploring
- **Highlight Actions**: Select any text to translate, rephrase, proofread, summarize, or send to chat
- **Past Wins**: Review previous focus sessions to see how your understanding has grown
- **Privacy-First**: All processing happens on your device using Chrome's built-in AI

## Installation

Clone the repository:

```bash
git clone https://github.com/sandipndev/neuropilot.git
cd neuropilot
```

Install dependencies:

```bash
pnpm i
```

Build the project:

```bash
pnpm run build
```

Or start the development server:

```bash
pnpm run dev
```

Two folders (`dev` and `prod`) will be created:
- Use `dev` for local development
- Use `prod` for production build

Load the chosen folder as an Unpacked Extension in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dev` or `prod` folder

## How It Works

NeuroPilot uses separate listeners for text, images, audio, and YouTube to measure engagement based on what you actually pay attention to. It stores attention traces, focus sessions, chat history, and past wins in IndexedDB (via Dexie.js), so all data stays on your device.

The intelligence runs in a background script that periodically reviews recent activity, updates your current focus, notices when you drift, and generates tiny quiz-bits to help you recall at the right moments. All of this is powered by Chrome's built-in on-device AI (Prompt API, Summarizer, Rewriter, Proofreader, Translator, etc.), with Gemini Nano running locally in the browser.

## Tech Stack

- React.js with TypeScript
- TailwindCSS for styling
- IndexedDB (via Dexie.js) for local storage
- Chrome Built-in AI (Gemini Nano)
- Plasmo framework for extension development

## Why NeuroPilot?

If you write code or study on the web, you've lived this moment — a tab for documentation leads to a blog post, then a video, then a forum thread, and somewhere between the scrolls, the thread of your original question frays. Minutes later, you know you saw something useful, but you can't quite recall where, or what.

The internet has made information abundant, but our ability to retain and build on that knowledge hasn't kept pace. NeuroPilot is a response to that quiet, familiar frustration. It doesn't block sites or nag you to focus. It understands what you're actually paying attention to and helps you build on it.

This is especially supportive for people with ADHD, where working memory and task switching can feel heavy, and for people who experience early memory decline, where gentle spaced recall helps keep learning active.
