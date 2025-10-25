# Requirements Document

## Introduction

The Pinnacle Dashboard (part of Neuropilot) is a comprehensive productivity and focus tracking interface that provides users with insights into their daily activities, focus patterns, and knowledge retention. It serves as a central hub for monitoring productivity, engaging with an AI assistant, testing knowledge through quizzes, and reviewing pulse data. The dashboard adapts its display based on user activity state (no focus, active focus, or wind-down time) and integrates multiple data sources from the existing API.

## Requirements

### Requirement 1: Stateful Focus Activity Display

**User Story:** As a user, I want to see my current focus state and be guided based on my activity level, so that I can maintain productive work habits throughout the day.

#### Acceptance Criteria

1. WHEN the user has not yet generated any Focus activity in Chrome THEN the system SHALL display a nudge message encouraging the user to start focusing
2. WHEN the user has active focus activity THEN the system SHALL display the current Focus Activity name and the time elapsed on that focus
3. WHEN the user has been focused for sufficient time during the day AND it is nighttime THEN the system SHALL display a message asking the user to wind down
4. WHEN displaying current focus activity THEN the system SHALL update the elapsed time in real-time
5. IF the user has no current focus but has focus history THEN the system SHALL display the most recent focus activity with its completion status

### Requirement 2: Focus Statistics Dashboard

**User Story:** As a user, I want to view weekly and daily statistics based on my focus data, so that I can understand my productivity patterns and trends.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch and display focus statistics from the API
2. WHEN displaying statistics THEN the system SHALL show the prime activity (most focused activity) with visual prominence
3. WHEN displaying weekly stats THEN the system SHALL show a week vs day toggle or comparison view
4. WHEN displaying daily stats THEN the system SHALL show total focus time for the current day
5. WHEN focus data is unavailable THEN the system SHALL display an appropriate empty state message
6. WHEN statistics are displayed THEN the system SHALL format time values in a human-readable format (hours and minutes)

### Requirement 3: AI Chat Interface Integration

**User Story:** As a user, I want to interact with an AI assistant through a chat interface, so that I can get help, insights, and answers related to my productivity and focus.

#### Acceptance Criteria

1. WHEN the user types a message in the chat input THEN the system SHALL send the message to the chat API using the sendChatMessage mutation
2. WHEN a message is sent THEN the system SHALL display the user's message immediately in the chat interface
3. WHEN the AI responds THEN the system SHALL fetch and display the response using the getChatMessages query
4. WHEN the chat interface loads THEN the system SHALL retrieve and display the message history
5. WHEN messages are displayed THEN the system SHALL show user messages and AI responses with distinct visual styling
6. WHEN the chat is scrolled THEN the system SHALL auto-scroll to the latest message when a new message arrives
7. IF the chat API call fails THEN the system SHALL display an error message to the user

### Requirement 4: Knowledge Recall Quiz Display

**User Story:** As a user, I want to see quiz questions to test my knowledge retention, so that I can reinforce what I've learned during my focus sessions.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch quiz questions from the getQuizQuestions API
2. WHEN displaying quiz questions THEN the system SHALL only show unanswered questions
3. WHEN a quiz question is answered THEN the system SHALL mark it as answered and remove it from the display
4. WHEN no unanswered quiz questions exist THEN the system SHALL display an appropriate empty state
5. WHEN quiz questions are displayed THEN the system SHALL show the question text clearly with answer options
6. WHEN the user selects an answer THEN the system SHALL provide immediate feedback on correctness

### Requirement 5: Pulse Data Visualization

**User Story:** As a user, I want to view pulse data that shows my activity patterns, so that I can understand when I'm most productive and engaged.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL fetch pulse data from the getPulses API
2. WHEN displaying pulse data THEN the system SHALL use real data from the API with no mock data
3. WHEN pulse data is visualized THEN the system SHALL present it in an intuitive, easy-to-understand format
4. WHEN pulse data includes timestamps THEN the system SHALL display them in a user-friendly format
5. IF pulse data is unavailable THEN the system SHALL display an appropriate empty state message
6. WHEN pulse data is displayed THEN the system SHALL highlight key insights or patterns

### Requirement 6: User Interface and Layout

**User Story:** As a user, I want a well-organized and visually appealing dashboard layout, so that I can easily access all features and information.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display all five main sections (focus state, stats, chat, quiz, pulse) in an organized layout
2. WHEN the viewport size changes THEN the system SHALL adapt the layout responsively
3. WHEN displaying the header THEN the system SHALL show user greeting, settings access, theme toggle, and current time
4. WHEN the user clicks settings THEN the system SHALL provide access to modal or full-screen settings
5. WHEN displaying sections THEN the system SHALL use consistent spacing, typography, and visual hierarchy
6. WHEN data is loading THEN the system SHALL display appropriate loading states for each section

### Requirement 7: Data Export Functionality

**User Story:** As a user, I want the option to export my focus data in CSV format, so that I can analyze my productivity data in external tools.

#### Acceptance Criteria

1. WHEN the user clicks the export option THEN the system SHALL generate a CSV file with focus data
2. WHEN generating the CSV THEN the system SHALL include relevant fields (focus item, time spent, date, keywords)
3. WHEN the CSV is ready THEN the system SHALL trigger a download in the user's browser
4. IF the export fails THEN the system SHALL display an error message to the user

### Requirement 8: Website Summaries Integration

**User Story:** As a user, I want to see summaries of websites I've visited during focus sessions, so that I can review the content I've engaged with.

#### Acceptance Criteria

1. WHEN the dashboard displays focus activities THEN the system SHALL show associated website summaries if available
2. WHEN website summaries are displayed THEN the system SHALL show the website title and a brief summary
3. WHEN the user clicks on a website summary THEN the system SHALL provide more detailed information
4. IF no website summaries exist for a focus session THEN the system SHALL not display the website summaries section
