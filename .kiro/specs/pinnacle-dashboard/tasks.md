# Implementation Plan

- [x] 1. Set up utility functions and shared types
  - Create time formatting utilities (milliseconds to hours/minutes, relative time)
  - Create CSV generation utility function
  - Create stats calculation utility functions
  - Define shared TypeScript interfaces in a types file
  - _Requirements: 2.6, 6.5, 7.2_

- [x] 2. Implement custom data hooks
- [x] 2.1 Create useFocusData hook
  - Implement hook to fetch current focus and focus history
  - Add polling mechanism (every 5 seconds)
  - Handle loading and error states
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.2 Create useWinsData hook
  - Implement hook to fetch top wins data
  - Handle loading states
  - _Requirements: 2.1, 2.2_

- [x] 2.3 Create useQuizQuestions hook
  - Implement hook to fetch quiz questions from API
  - Filter out answered questions using localStorage
  - Provide markAsAnswered callback function
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2.4 Create usePulseData hook
  - Implement hook to fetch pulse data from API
  - Add polling mechanism (every 60 seconds)
  - Handle empty states
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 2.5 Create useActivitySummary hook
  - Implement hook to fetch latest activity summary
  - Handle loading states
  - _Requirements: 8.1_

- [x] 3. Build Header component
  - Create Header component with user greeting
  - Implement real-time clock display (updates every second)
  - Add settings button (placeholder for modal)
  - Add theme toggle button (light/dark mode state)
  - Implement responsive layout
  - _Requirements: 6.3_

- [x] 4. Build Focus State Section component
- [x] 4.1 Implement focus state determination logic
  - Create function to determine state (no-focus, active-focus, wind-down)
  - Calculate if it's nighttime (after 8 PM)
  - Calculate total daily focus time
  - _Requirements: 1.1, 1.3_

- [x] 4.2 Create FocusStateSection component
  - Display "no focus" state with encouragement message
  - Display active focus with focus item name and elapsed time
  - Display wind-down message when conditions are met
  - Implement real-time time updates for active focus
  - Add smooth animations for state transitions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 5. Build Statistics Section component
- [x] 5.1 Implement stats calculation logic
  - Calculate daily total focus time (last 24 hours)
  - Calculate weekly total focus time (last 7 days)
  - Aggregate focus time by activity
  - Determine prime activity (most time spent)
  - Calculate top 5 activities
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5.2 Create StatsSection component
  - Display prime activity with visual prominence
  - Implement week vs day toggle
  - Display daily and weekly totals
  - Show top activities with progress bars or charts
  - Format time values in human-readable format
  - Display empty state when no data available
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 6. Build Quiz Section component
- [x] 6.1 Implement quiz answer tracking
  - Create localStorage functions to track answered questions
  - Implement getAnsweredQuestions function
  - Implement markQuestionAsAnswered function
  - Implement filterUnansweredQuestions function
  - _Requirements: 4.2, 4.3_

- [x] 6.2 Create QuizSection component
  - Display one quiz question at a time
  - Show two answer options as buttons
  - Implement answer selection handler
  - Show immediate feedback on answer (correct/incorrect)
  - Mark question as answered after selection
  - Display progress indicator (X of Y questions)
  - Show empty state when all questions answered
  - Add celebration animation for correct answers
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7. Build Pulse Section component
  - Create PulseSection component
  - Display pulse messages from API (no mock data)
  - Format timestamps in relative time ("2 hours ago")
  - Add visual categorization with icons
  - Implement smooth animations for pulse items
  - Display empty state when no pulses available
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Build Chat Interface component
- [x] 8.1 Create chat message display
  - Create ChatMessage component for individual messages
  - Distinguish user vs assistant messages visually
  - Display message timestamps
  - Implement scrollable message area with auto-scroll
  - _Requirements: 3.5, 3.6_

- [x] 8.2 Create chat input and interaction
  - Create ChatInput component with text field and send button
  - Implement message sending handler
  - Add loading indicator while waiting for response
  - Display error messages with retry option
  - Store messages in component state
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [x] 8.3 Add chat API integration placeholders
  - Create placeholder sendChatMessage function
  - Create placeholder getChatMessages function
  - Add TODO comments for backend implementation
  - Implement mock responses for testing UI
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 9. Build Website Summaries component
  - Create WebsiteSummariesSection component
  - Display activity summary if available
  - Show website title and summary text
  - Implement collapsible section
  - Display empty state when no summaries
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 10. Build Export functionality
- [ ] 10.1 Implement CSV generation
  - Create generateCSV function
  - Include focus history data in CSV
  - Include wins data in CSV
  - Format data with proper headers and escaping
  - _Requirements: 7.1, 7.2_

- [ ] 10.2 Create ExportButton component
  - Create button component with download icon
  - Implement click handler to generate CSV
  - Trigger browser download with proper filename
  - Display error message if export fails
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 11. Build main App component and layout
- [ ] 11.1 Create App component structure
  - Set up main App component with state management
  - Initialize all custom hooks for data fetching
  - Manage global loading state
  - Implement error boundary wrapper
  - _Requirements: 6.1, 6.6_

- [ ] 11.2 Implement dashboard layout
  - Create grid-based layout for desktop
  - Arrange all sections according to wireframe
  - Implement responsive breakpoints (desktop, tablet, mobile)
  - Add consistent spacing and visual hierarchy
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 11.3 Integrate all components
  - Add Header component to layout
  - Add FocusStateSection component
  - Add StatsSection component
  - Add ChatSection component
  - Add QuizSection component
  - Add PulseSection component
  - Add WebsiteSummariesSection component
  - Add ExportButton component
  - Pass appropriate props to each component
  - _Requirements: 6.1_

- [ ] 12. Implement styling and animations
  - Apply Tailwind CSS classes for consistent styling
  - Implement color scheme (blue, green, orange, red, gray)
  - Add typography styles (headings, body, monospace)
  - Implement page load fade-in animations with Framer Motion
  - Add hover effects and transitions
  - Add quiz celebration animation
  - Ensure responsive design works across breakpoints
  - _Requirements: 6.5_

- [ ] 13. Add accessibility features
  - Add semantic HTML elements throughout
  - Add ARIA labels to interactive elements
  - Implement keyboard navigation support
  - Add focus indicators for keyboard users
  - Ensure sufficient color contrast (WCAG AA)
  - Add screen reader friendly text
  - Test with keyboard-only navigation
  - _Requirements: 6.5_

- [ ] 14. Implement error handling
  - Create ErrorBoundary component
  - Add error states to all data hooks
  - Display user-friendly error messages
  - Implement retry mechanisms for failed API calls
  - Add graceful degradation (show partial data if some APIs fail)
  - Log errors to console for debugging
  - _Requirements: 3.7, 7.4_

- [ ] 15. Final integration and polish
  - Test all components with real API data
  - Verify no mock data is used (especially for pulse)
  - Test all user interactions (quiz answers, chat, export)
  - Verify real-time updates work correctly
  - Test responsive layout on different screen sizes
  - Verify all empty states display correctly
  - Test error scenarios and recovery
  - Optimize performance (check for unnecessary re-renders)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_
