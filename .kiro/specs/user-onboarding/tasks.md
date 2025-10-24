# Implementation Plan

- [x] 1. Set up shadcn/ui and create base UI components
  - Install and configure shadcn/ui CLI for the welcome page project
  - Add shadcn/ui components: Button, Card, Input, Label, Progress, Badge, Alert, Collapsible
  - Create a `components/ui` directory with all required shadcn components
  - Verify theme colors are properly integrated with shadcn components
  - _Requirements: 5.1, 5.5_

- [x] 2. Implement Chrome AI type definitions and utilities
  - Create `src/types/chrome-ai.d.ts` with Chrome AI API type definitions
  - Create `src/utils/chrome-ai.ts` with helper functions for checking AI availability
  - Implement `checkChromeAIAvailability()` function
  - Implement `checkModelAvailability()` function
  - _Requirements: 2.2, 2.3, 2.4, 3.1_

- [x] 3. Create onboarding state management with Context API
  - Create `src/contexts/OnboardingContext.tsx` with state interface
  - Implement OnboardingProvider with all state management logic
  - Add methods: `goToStep`, `markStepComplete`, `updateFlagsStatus`, `updateModelProgress`, `setModelAvailable`, `updateUserData`
  - Create custom hook `useOnboarding()` for consuming context
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 4. Build ProgressIndicator component
  - Create `src/components/ProgressIndicator.tsx`
  - Implement horizontal step indicator with numbered circles
  - Add progress line with animated fill
  - Style with theme colors (primary, muted, chart-4)
  - Add CheckCircle2 icons for completed steps
  - _Requirements: 6.1, 5.1, 5.4_

- [x] 5. Build IntroductionStep component
  - Create `src/components/steps/IntroductionStep.tsx`. Remember this is like a story.
  - Implement hero section with NeuroPilot branding
  - Create concept explanation cards for Attention (Eye icon) and Focus (Target icon)
  - Add value proposition section explaining quiz feature and motivation
  - Implement fade-in-up animations using tw-animate-css
  - Add pulse animation for concept icons
  - Style with shadcn Card components and theme colors
  - Add "Get Started" button to proceed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.3_

- [x] 6. Build FlagsConfigurationStep component
  - Create `src/components/steps/FlagsConfigurationStep.tsx`
  - Create `src/components/FlagItem.tsx` for individual flag display
  - Implement flag status checking using Chrome AI availability
  - Display three flags with status indicators (CheckCircle2/AlertCircle icons)
  - Add shadcn Collapsible component for instructions panel
  - Create links to chrome://flags pages using shadcn Button with variant="outline"
  - Add refresh button with RefreshCw icon to re-check status
  - Style with shadcn Card components and theme colors (chart-4 for enabled, chart-1 for disabled)
  - Disable continue button until all flags are enabled
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 5.1, 5.5_

- [ ] 7. Build ModelDownloadStep component
  - Create `src/components/steps/ModelDownloadStep.tsx`
  - Implement model availability check on component mount
  - Create download button with Download icon from lucide-react
  - Implement `downloadModel()` function with progress monitoring
  - Add shadcn Progress component with animated fill
  - Display download percentage with real-time updates
  - Add success state with CheckCircle2 icon and chart-4 color
  - Implement error handling with shadcn Alert component (variant="destructive")
  - Add retry button for failed downloads
  - Style with shadcn Card and Badge components
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 5.1, 5.4, 5.5_

- [ ] 8. Build UserInfoStep component
  - Create `src/components/steps/UserInfoStep.tsx`
  - Implement form with shadcn Input and Label components
  - Add name field validation (required, min 1 character, trim whitespace)
  - Display validation errors inline with destructive color
  - Create submit button with loading state (Loader2 icon with spin)
  - Implement form submission calling `setUserName` mutation
  - Add success animation with CheckCircle2 icon
  - Handle submission errors gracefully
  - Style with shadcn Card component
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.4_

- [ ] 9. Create API integration for user data
  - Implement `src/api/mutations/set-user-name.ts` mutation function
  - Create function to save user name to localStorage
  - Add error handling for storage failures
  - Create `src/api/queries/get-user-name.ts` query function
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 10. Integrate all components in App.tsx
  - Update `src/App.tsx` to wrap with OnboardingProvider
  - Add ProgressIndicator at the top
  - Implement step routing logic to render current step
  - Add step transition animations (fade-out/fade-in)
  - Handle onboarding completion and redirect logic
  - Add localStorage check to skip onboarding if already completed
  - _Requirements: 6.1, 6.2, 6.3, 5.1, 5.3_

- [ ] 11. Add accessibility features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation (Tab, Enter, Escape)
  - Add focus management between steps
  - Implement screen reader announcements for status changes
  - Add prefers-reduced-motion support to disable animations
  - Test with keyboard-only navigation
  - _Requirements: 5.1, 5.5, 5.6_

- [ ] 12. Polish animations and transitions
  - Fine-tune animation timing and easing
  - Add hover effects to buttons and cards
  - Implement smooth step transitions
  - Add micro-interactions (button press, input focus)
  - Test animation performance
  - Ensure animations respect prefers-reduced-motion
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
