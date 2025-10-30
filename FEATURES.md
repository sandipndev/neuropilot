# NeuroPilot: Technical Feature Documentation

## Core Architecture

NeuroPilot is a Chrome extension that leverages Chrome's built-in AI APIs (Prompt API, Summarizer API, Rewriter API, Writer API) to provide intelligent attention tracking and focus management. The system operates entirely client-side using on-device AI models, ensuring privacy and low latency.

## Feature Categories

### 1. Cognitive Attention Tracking System

The extension implements a sophisticated multi-modal attention detection system that runs continuously in the background.

#### Text Attention Monitoring
- **Real-time viewport analysis**: Scans all text elements (paragraphs, headings, lists) in the viewport
- **Attention scoring algorithm**: Multi-factor scoring system (0-115 points) based on:
  - Viewport position and center proximity (0-30 points)
  - Mouse proximity and hover behavior (0-35 points)
  - Scroll velocity and behavior patterns (0-25 points)
  - Element semantic importance (0-10 points)
  - Main content detection bonus (0-15 points)
- **Sustained attention detection**: Tracks when users maintain focus on text for configurable duration (default: sustained threshold)
- **Reading progress calculation**: Estimates words read based on time elapsed and configurable WPM (words per minute)
- **Confidence scoring**: 0-100 confidence metric combining duration, engagement signals, and content quality
- **Smart filtering**: Ignores navigation, headers, footers, ads, and other non-content elements

#### Image Attention Monitoring
- **Hover-based detection**: Tracks mouse hover duration on images
- **Threshold-based triggering**: Emits attention events after sustained hover (default threshold)
- **Image metadata extraction**: Captures src, alt text, title, dimensions, and base64 encoding
- **Confidence calculation**: Based on hover duration, image size, and viewport coverage
- **CORS handling**: Fetches and converts images to base64 for AI processing

#### Audio Attention Monitoring
- **Playback tracking**: Monitors HTML audio elements across the page
- **Duration accumulation**: Tracks total playback time even across pause/resume cycles
- **Dynamic element detection**: Uses MutationObserver to track dynamically added audio elements
- **Metadata extraction**: Captures audio source, title, duration, and playback position
- **Confidence metrics**: Based on playback duration, completion percentage, and continuity

#### YouTube-Specific Attention
- **Specialized YouTube tracking**: Dedicated monitoring for YouTube video consumption
- **Caption extraction**: Captures video captions/subtitles the user reads
- **Active watch time**: Measures actual engaged viewing time
- **Video metadata**: Tracks title, channel name, and video ID

### 2. Background Inference Engine

A task queue system that runs periodic AI inference tasks to analyze user activity.

#### Focus Detection & Tracking
- **Sliding window analysis**: Analyzes recent activity (default: 10 minutes) to detect current focus area
- **Keyword extraction**: Uses AI to identify 1-2 word focus topics from attention data
- **Focus drift detection**: AI-powered detection of topic shifts using semantic analysis
- **Focus summarization**: Aggregates keywords into coherent focus descriptions
- **Time tracking**: Records start/end timestamps for each focus session
- **Notification system**: Alerts users when focus drift is detected

#### Activity Summarization
- **Real-time summaries**: Generates 5-6 word third-person summaries of current activity
- **Periodic updates**: Runs every 10 minutes to keep summaries fresh
- **Deduplication**: Avoids storing duplicate summaries
- **Natural language**: "You are reading about X" style summaries

#### Pulse Generation
- **Personalized nudges**: Creates 5 diverse learning progress updates every 5 minutes
- **Data-driven insights**: Uses actual hours spent, resources explored, and key quotes
- **Multiple patterns**: Progress celebrations, content reminders, topic connections, resource counts, page reviews
- **Engagement optimization**: Under 15 words each, casual tone, no generic advice

#### Quiz Question Generation
- **Adaptive question count**: Generates 8+ questions based on activity volume
- **Content-specific**: Questions derived from actual text attention and summaries
- **Two-option format**: Binary choice questions with one correct answer
- **Factual focus**: Tests understanding of specific learned content
- **Periodic refresh**: Updates every 2 minutes with new questions

#### Doomscrolling Detection
- **Attention density analysis**: Monitors attention items per time window
- **Configurable thresholds**: Customizable time window and item count thresholds
- **Low-engagement alerts**: Notifies when attention density falls below threshold
- **Cooldown system**: Prevents notification spam with configurable cooldown periods

#### Website Summarization
- **Automatic page summarization**: Generates summaries of visited websites
- **Content extraction**: Uses main content detection for accurate summarization
- **Storage optimization**: Stores summaries in IndexedDB for quick retrieval

### 3. On-Device AI Integration

All AI processing happens locally using Chrome's built-in AI capabilities.

#### Language Model (Prompt API)
- **Multimodal support**: Handles text, image, and audio inputs
- **Configurable parameters**: Adjustable temperature and topK for response variation
- **Session management**: Maintains conversation context across interactions
- **Specialized models**: Separate configurations for image captioning and audio transcription

#### Summarizer API
- **Multiple modes**: tldr, teaser, key-points, headline
- **Context-aware**: Accepts custom context prompts for better results
- **Plain-text output**: Optimized for display in extension UI

#### Rewriter API
- **Tone adjustment**: formal, as-is, more-casual
- **Length control**: shorter, as-is, longer
- **Plain-text format**: Direct text output for immediate use

#### Writer API
- **Tone options**: formal, neutral, casual
- **Content generation**: Creates new text based on prompts

### 4. Context Menu Integration

Rich context menu system for quick actions on web content.

#### Text Selection Actions
- Proofread: Grammar and spelling correction
- Rephrase: Rewrite with different wording
- Summarize: Condense selected text
- Analyze: Deep analysis of selected content
- Add to Chat: Send selection to chat interface
- Translate: Multi-language translation (20+ languages supported)

#### Image Actions
- Add to Chat: Send image to chat for AI analysis

#### Page-Level Actions
- Chat with Page: Interactive Q&A about page content
- Summarize Page: Generate page summary
- Extract Key Points: Bullet-point extraction
- Summarize Link: Fetch and summarize linked pages

### 5. Intent Queue System

Asynchronous processing system for user actions.

#### Intent Types
- PROOFREAD: Text correction requests
- TRANSLATE: Language translation (20+ languages)
- REPHRASE: Text rewriting
- SUMMARIZE: Content condensation
- CHAT: Conversational interactions with text/image/audio

#### Processing Flow
- Queue-based architecture: Prevents race conditions
- Side panel integration: Opens side panel automatically
- Notification system: Alerts UI when new intents arrive
- Processed state tracking: Prevents duplicate processing

### 6. Data Persistence Layer

IndexedDB-based storage using Dexie.js for efficient data management.

#### Database Tables
- **websiteVisits**: URL, title, opened_at, closed_at, active_time, summary
- **textAttention**: Text content, confidence, reading progress, timestamp
- **imageAttention**: Image data, caption, confidence, timestamp
- **audioAttention**: Audio metadata, summary, confidence, timestamp
- **youtubeAttention**: Video metadata, captions, watch time, timestamp
- **focus**: Focus items, keywords, time_spent sessions, last_updated
- **pulse**: Motivational messages, timestamp
- **activitySummary**: Activity summaries, timestamp
- **quizQuestions**: Questions, options, correct answers, timestamp
- **chat**: Chat sessions with user activity context
- **chatMessages**: Individual messages with type (text/image/audio)
- **pastWins**: Historical focus achievements
- **pomodoro**: Pomodoro timer state
- **intentQueue**: Pending user action requests
- **processedIntents**: Completed intent records

### 7. Chat System

Context-aware conversational AI with access to browsing history.

#### Features
- **Activity-aware context**: Automatically includes recent browsing activity (24h window)
- **Multimodal input**: Supports text, images, and audio in conversations
- **Streaming responses**: Real-time response generation with chunk-by-chunk display
- **Automatic title generation**: Creates 3-4 word titles from first exchange
- **Session persistence**: Maintains conversation history across sessions
- **Source citation**: References specific URLs when answering questions

#### System Prompt Design
- Concise responses (1-2 lines default)
- Accuracy-focused (only uses provided context)
- Honest about limitations
- Direct and actionable
- Natural, friendly language

### 8. Selection Insights UI

Floating toolbar that appears on text selection.

#### Quick Actions
- Proofread with visual feedback
- Translate to 20+ languages (dropdown menu)
- Rephrase with AI
- Summarize selected text
- Add to chat for deeper discussion

#### UX Features
- Smooth slide-up animation
- Hover state feedback
- Click-outside dismissal
- Prevents accidental deselection
- Backdrop blur effect

### 9. Notification System

Smart notification delivery with cooldown management.

#### Notification Types
- Focus drift detected
- Doomscrolling detected
- Custom pulse messages
- Quiz reminders

#### Cooldown System
- Configurable cooldown periods (default: 15 seconds)
- Per-notification-type tracking
- Prevents notification fatigue

### 10. Garbage Collection

Automated data cleanup to prevent storage bloat.

#### Cleanup Tasks
- Runs daily (24-hour intervals)
- Removes old attention records
- Cleans up expired focus sessions
- Optimizes database size

### 11. Task Scheduler

Priority queue system for background tasks.

#### Scheduling
- Continuous tasks loop: Every 30 seconds
- Pulse generation: Every 5 minutes
- Quiz generation: Every 2 minutes
- Garbage collection: Every 24 hours
- Concurrency control: Single-task execution to prevent resource conflicts

#### Task Management
- Task deduplication: Prevents duplicate task enqueueing
- Error handling: Graceful failure recovery
- Task metadata tracking: Monitors task execution state

### 12. Chrome Extension Permissions

Minimal permission set for maximum functionality.

#### Required Permissions
- activeTab: Access current tab content
- storage: Persist user data and settings
- alarms: Schedule periodic background tasks
- contextMenus: Add right-click menu options
- declarativeNetRequest: Modify headers for CORS
- scripting: Inject content scripts for attention tracking

#### Host Permissions
- https://*/*: Access all HTTPS websites for tracking

## Technical Implementation Details

### Performance Optimizations
- Debounced scroll tracking (150ms timeout)
- Throttled attention calculation (configurable update interval)
- Lazy element discovery (only visible elements)
- Efficient DOM queries (cached selectors)
- Incremental reading progress updates

### Privacy & Security
- All processing happens on-device
- No data sent to external servers
- IndexedDB encryption via browser
- CORS headers modified only for extension resources
- No API keys or external dependencies

### Browser Compatibility
- Chrome 128+ (requires Chrome AI APIs)
- Trial tokens for AI API access
- Content Security Policy: wasm-unsafe-eval for AI models

## Pitch Video Story Arc

### Opening (Problem Statement)
"Every day, we browse dozens of websites, read hundreds of articles, and consume countless pieces of information. But how much do we actually retain? How often do we lose focus and drift into mindless scrolling?"

### The Solution (NeuroPilot Introduction)
"NeuroPilot is your AI co-pilot for focused learning. It runs silently in the background, understanding what you're reading, watching, and learning about."

### Core Technology (The Magic)
"Using Chrome's built-in AI, NeuroPilot tracks your attention across text, images, and videos. It knows when you're truly focused versus when you're just scrolling. Every hover, every pause, every moment of sustained reading is analyzed to understand your learning journey."

### Intelligence Layer (The Brain)
"Behind the scenes, AI continuously analyzes your activity. It detects your current focus area, notices when you drift to unrelated topics, and generates personalized learning progress updates. It even creates quiz questions based on what you've actually read - not generic questions, but specific tests of your understanding."

### User Experience (The Value)
"When you select text, NeuroPilot offers instant actions: proofread, translate to 20+ languages, rephrase, or discuss in chat. Right-click any page to chat with it, extract key points, or get a summary. Your AI assistant has full context of everything you've been learning."

### Privacy First (Trust Factor)
"Everything happens on your device. No data leaves your browser. No external servers. No API keys. Just pure, private, on-device AI."

### The Impact (Transformation)
"NeuroPilot transforms scattered browsing into structured learning. It helps you stay focused, remember what matters, and build genuine understanding. Your browsing history becomes your learning history."

### Closing (Call to Action)
"Stop losing your learning to the void of endless tabs. Start building knowledge that sticks. NeuroPilot - your AI co-pilot for focused learning."

## Key Differentiators

1. **True Attention Tracking**: Not just page views, but actual cognitive engagement measurement
2. **On-Device AI**: Complete privacy with zero external dependencies
3. **Multi-Modal Understanding**: Text, images, audio, and video comprehension
4. **Context-Aware Chat**: AI that knows what you've been learning
5. **Proactive Engagement**: Pulse messages and quizzes keep you engaged
6. **Focus Drift Detection**: AI-powered detection of attention shifts
7. **Doomscrolling Prevention**: Identifies and alerts on low-engagement patterns
8. **Seamless UX**: Context menus, selection toolbar, and side panel integration

