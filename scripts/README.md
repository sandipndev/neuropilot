# Inference Layer Scripts

## Requirements

- Chrome Browser Only (Canary, Dev, or Beta)
- Enable `chrome://flags/#optimization-guide-on-device-model` (set to "Enabled BypassPerfRequirement")
- Restart Chrome and wait for Gemini Nano to download
- Make sure to follow the [guide](https://discord.com/channels/1022042660044808222/1425928159718801519/1427712579538784438) I shared with y'all on Discord.

## Usage

1. Open browser console (`F12` or `Cmd+Option+J`)
2. Copy entire script contents
3. Paste into console and press Enter
4. View JSON output

## Scripts

### consoleSummarizer.js
Generates webpage summaries using on-device AI.

**Input:** Current webpage  
**Output:** JSON with summary
```json
{
  "summary": "Concise summary of page content..."
}
```

### getCurrentFocus.js
Analyzes user attention patterns to determine current learning focus.

**Input:** Mock attention and website data  
**Output:** JSON with focus analysis
```json
{
  "primary_focus": "TypeScript Generics",
  "focus_area": "Problem Solving / Debugging",
  "key_topics": ["generics", "typescript", "constraints"],
  "attention_metrics": {
    "total_time_seconds": 350,
    "interaction_count": 2,
    "focus_intensity": 0.92
  },
  "ai_insights": "The user is debugging TypeScript generic constraints...",
  "ai_powered": true
}
```

### generateQuizQuestions.js
Creates quiz questions based on learning history.

**Input:** Mock attention, website, and focus data  
**Output:** Array of quiz questions
```json
[
  {
    "id": "quiz_1729635420123_0",
    "question": "What happens when you use await inside an async function?",
    "option_1": "It pauses execution until the promise resolves",
    "option_2": "It immediately returns the promise",
    "correct_option": 1
  }
]
```

### generatePulse.js
Generates personalized learning progress updates and reminders.

**Input:** Mock attention, website, and focus data  
**Output:** Array of pulse updates
```json
[
  "You've spent 10h on React useEffect Hook - great progress!",
  "Remember: Effects have a lifecycle separate from components...",
  "Connect React State Management with React useEffect Hook",
  "You've explored 6 resources - try practicing what you learned"
]
```

### hasFocusShifted.js
Detects if user's learning focus has shifted between topics.

**Input:** Mock attention, website, and focus data  
**Output:** Shift analysis string
```
SHIFT: yes | TYPE: pivot | REASON: Moved from "PostgreSQL Query Optimization" (11h) to "Redis Caching Patterns" (5h) after 14h gap | RECOMMENDATION: Major shift detected - ensure previous topic fundamentals are solid
```

> [!IMPORTANT]  
> The shift analysis is based on the user's attention patterns and the content of the webpages they visited. Also, the prompts in `hasFocusShifted.js` are not final and can be improved based on everyone's feedback.


## Type Definitions

```typescript
type ActivityWebsiteVisited = {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  metadata: Record<string, string>;
  summary: string;
  opened_time: number;
  closed_time: number;
  active_time: number;
}

type ActivityUserAttention = {
  id: string;
  website: ActivityWebsiteVisited;
  timestamp: number;
  text_content: string;
  attention_time: number;
}

type Focus = {
  id: string;
  focus_item: string;
  time_spent: Array<{
    start: number;
    stop: number;
  }>;
}

type QuizQuestion = {
  id: string;
  question: string;
  option_1: string;
  option_2: string;
  correct_option: 1 | 2;
}
```

## Troubleshooting

**"LanguageModel is not defined"**  
Enable Chrome AI flags and restart browser.

**No output**  
Check console for errors. Ensure entire script was copied.

**AI unavailable**  
Scripts include fallback logic when Gemini Nano is unavailable.
