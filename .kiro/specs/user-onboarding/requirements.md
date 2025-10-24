# Requirements Document

## Introduction

The onboarding experience is the first interaction users have with NeuroPilot. It needs to educate users about the core concepts (Attention and Focus), ensure their browser environment is properly configured with Chrome AI flags and the Gemini Nano model, and collect basic user information. The experience should be visually engaging with animations to help users understand the product's value proposition while guiding them through technical setup steps.

## Requirements

### Requirement 1: Educational Introduction

**User Story:** As a new user, I want to understand what NeuroPilot does and how Attention and Focus work, so that I can see the value before investing time in setup.

#### Acceptance Criteria

1. WHEN the user first opens the onboarding page THEN the system SHALL display an animated introduction explaining NeuroPilot's purpose
2. WHEN the introduction is shown THEN the system SHALL explain the Attention concept (actively reading/browsing earns attention points)
3. WHEN the introduction is shown THEN the system SHALL explain the Focus concept (sustained attention on related topics earns focus points)
4. WHEN the introduction is shown THEN the system SHALL explain that users can later view focus scores, topics read, and take gamified quizzes
5. WHEN the introduction is shown THEN the system SHALL explain the motivation (combating short attention spans from TikTok, Instagram reels, and AI)
6. WHEN the introduction is shown THEN the system SHALL explain that everything runs in the browser with local AI models and no API calls after model download
7. WHEN the user finishes reading the introduction THEN the system SHALL provide a clear way to proceed to configuration steps

### Requirement 2: Chrome AI Flags Configuration

**User Story:** As a new user, I want clear guidance on enabling required Chrome flags, so that I can properly configure my browser without confusion.

#### Acceptance Criteria

1. WHEN the user reaches the flags configuration step THEN the system SHALL display the current status of required Chrome flags
2. WHEN checking flag status THEN the system SHALL detect if `chrome://flags/#prompt-api-for-gemini-nano` is enabled
3. WHEN checking flag status THEN the system SHALL detect if `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` is enabled
4. WHEN checking flag status THEN the system SHALL detect if `chrome://flags/#optimization-guide-on-device-model` is enabled
5. WHEN a flag is disabled THEN the system SHALL display it with a clear disabled indicator
6. WHEN a flag is enabled THEN the system SHALL display it with a clear enabled indicator
7. WHEN the user needs to enable flags THEN the system SHALL provide easy-to-understand instructions with direct links to the flag pages
8. WHEN the user needs to enable flags THEN the system SHALL display information about what Chrome flags are and why they're needed
9. WHEN all required flags are enabled THEN the system SHALL allow the user to proceed to the next step
10. WHEN not all flags are enabled THEN the system SHALL prevent progression to the next step

### Requirement 3: AI Model Download

**User Story:** As a new user, I want to download the Gemini Nano model with clear progress feedback, so that I know the download is working and how long it will take.

#### Acceptance Criteria

1. WHEN the user reaches the model download step THEN the system SHALL check if the Gemini Nano model is already available
2. WHEN the model is not available THEN the system SHALL display a button to initiate the download
3. WHEN the user clicks the download button THEN the system SHALL call `LanguageModel.create()` with a download progress monitor
4. WHEN the model is downloading THEN the system SHALL display a progress bar showing the download percentage
5. WHEN the download progress updates THEN the system SHALL update the progress bar in real-time
6. WHEN the download completes successfully THEN the system SHALL display a success message
7. WHEN the download fails THEN the system SHALL display an error message with troubleshooting guidance
8. WHEN the model is already downloaded THEN the system SHALL skip the download and show a success indicator
9. WHEN the model download is complete THEN the system SHALL allow the user to proceed to the next step

### Requirement 4: User Information Collection

**User Story:** As a new user, I want to provide my basic information in a simple form, so that I can personalize my NeuroPilot experience.

#### Acceptance Criteria

1. WHEN the user reaches the information collection step THEN the system SHALL display a form requesting the user's name
2. WHEN the user enters their name THEN the system SHALL validate that the name is not empty
3. WHEN the user submits valid information THEN the system SHALL save the name using the `setUserName` mutation
4. WHEN the user submits the form THEN the system SHALL provide visual feedback that the information is being saved
5. WHEN the information is saved successfully THEN the system SHALL complete the onboarding process
6. WHEN onboarding is complete THEN the system SHALL redirect the user to the main application interface

### Requirement 5: Visual Design and Animations

**User Story:** As a new user, I want an engaging and visually appealing onboarding experience with smooth animations, so that I feel excited about using NeuroPilot.

#### Acceptance Criteria

1. WHEN any onboarding step is displayed THEN the system SHALL use smooth transitions between steps
2. WHEN explaining Attention and Focus concepts THEN the system SHALL include animated visualizations to illustrate the concepts
3. WHEN showing progress through onboarding steps THEN the system SHALL display a progress indicator
4. WHEN the user completes a step THEN the system SHALL provide visual feedback (animation, checkmark, etc.)
5. WHEN displaying status indicators THEN the system SHALL use clear visual design (colors, icons) to indicate success/failure states
6. WHEN the user interacts with buttons or controls THEN the system SHALL provide immediate visual feedback

### Requirement 6: Navigation and Progress Tracking

**User Story:** As a new user, I want to see my progress through the onboarding steps and navigate between them, so that I understand where I am in the process.

#### Acceptance Criteria

1. WHEN the user is in any onboarding step THEN the system SHALL display which step they are on (e.g., "Step 1 of 3")
2. WHEN the user completes a step THEN the system SHALL automatically advance to the next step
3. WHEN the user wants to go back THEN the system SHALL allow navigation to previous completed steps
4. WHEN the user has not completed required actions in a step THEN the system SHALL disable the "Next" or "Continue" button
5. WHEN the user has completed required actions in a step THEN the system SHALL enable the "Next" or "Continue" button
