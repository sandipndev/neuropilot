#### NeuroPilot — your AI co-pilot for focus

- Focus. Learn. Remember. 🚀
- Turns chaotic browsing into mindful learning
- Tracks what you read, senses drift, nudges you back
- Builds your Knowledge Garden with recall mini-games

### Architecture

```
Background
====================================
BACKEND

Event Triggered:
- Data Extraction
- Feature Extration
- Time Series -> IndexedDB

[BG] Activity Tracking
[BG] Garbage Collector
[BG] Last 10 min no activity = auto pause focus

Inference Layer (background AI processes, Gemini Models):
- [BG] Website summary
- [BG] Focus detection
  -> Focus Shift detection
- [BG] Quiz generation
- [BG] Pulse generation
====================================

.......... via the persistence layer [for time series/bg data] (IndexedDB)
.......... via the persistence layer [for Settings and Key/value] (Local Storage)

Foreground
====================================
API Layer:
- Queries/Mutation for serving the frontend

FRONTEND
- Extension: Popup
- Extension: Fullpage
====================================
```

### DB Tables
ActivityWebsitesVisited:
- id
- timestamp
- url
- title
- metadata
- summary
- opened_time
- closed_time
- active_time

ActivityUserAttention:
- id
- website_id
- timestamp
- text_content

// Runs every 20s for the last 20s UserAttention
AttentionSummaries:
- id
- timestamp
- summary

ChatMessages:
- id
- time
- message: JSON

QuizQuestions:
- id
- timestamp
- question
- option_1
- option_2
- is_answered
- correct_option: 1 | 2

Pulse:
- id
- message

Focus:
- id
- focus_item: String // should be very small - 1/2 words
- time_spent: Array<{
  start: Timestamp
  stop: Timestamp
}>

PastWeeksFocus:
- id
- focus_item: String
- total_time_spent: Int

Wins: // Top 3 all time
- id
- focus_item: String
- total_time_spent: Int

### Local Storage Keys
- User Name
- Attention Time: 0.5s
- Focus Time: 5 minute
- Paused

### API Layer
- mutation setUserName(name: String)
- query getUserName()

- query primeActivity {
  state: PrimeActivityState -> "START_FOCUS" | "IN_SESSION" | "WIND_DOWN",
  context: {
    focus: [ Focus ],
    totalFocusToday: Int,
  }
}

type Focus {
  id
  focusItem
  timeSpent: [ { start, stop }]
}

- query topActivities() -> Focus[]

- mutation sendChatMessage(message: String) 
- query chatMessages() -> ChatMessage[]

- query quizQuestions() -> Quiz[]

- query pulse() -> Pulse[]

- query focus() -> Focus[]

- mutation pomodoroStart()
- mutation pomodoroStop()
- query pomodoro()

- query recentActivity() -> Activity[]
- query wins() -> PastFocus[]
