# Design Document

## Overview

The user onboarding experience for NeuroPilot is a multi-step wizard built as a React application using Vite, React 19, TypeScript, and Tailwind CSS v4 with shadcn/ui components. The onboarding flow consists of an introduction phase followed by three configuration steps: Chrome AI flags verification, Gemini Nano model download, and user information collection. The design emphasizes visual appeal with smooth animations using tw-animate-css and lucide-react icons, creating an engaging first impression while ensuring technical prerequisites are met. All UI components will use shadcn/ui primitives styled with the existing theme color system.

## Architecture

### Component Structure

```
App.tsx (Main Container)
├── OnboardingProvider (State Management)
├── ProgressIndicator (Step tracking)
└── StepContainer (Current step renderer)
    ├── IntroductionStep
    │   ├── HeroSection
    │   ├── ConceptExplanation (Attention)
    │   ├── ConceptExplanation (Focus)
    │   └── ValueProposition
    ├── FlagsConfigurationStep
    │   ├── FlagStatusChecker
    │   ├── FlagItem (x3 for each flag)
    │   └── InstructionsPanel
    ├── ModelDownloadStep
    │   ├── ModelStatusChecker
    │   ├── DownloadButton
    │   └── ProgressBar
    └── UserInfoStep
        ├── NameInput
        └── SubmitButton
```

### State Management

The onboarding flow will use React Context API to manage:
- Current step index (0-3)
- Completion status of each step
- Chrome AI flags status
- Model download progress
- User form data

### Data Flow

1. **Introduction → Flags**: User clicks "Get Started" after reading intro
2. **Flags → Model**: All flags verified as enabled
3. **Model → User Info**: Model successfully downloaded
4. **User Info → Complete**: Form submitted and saved

## Components and Interfaces

### OnboardingContext

```typescript
interface OnboardingState {
  currentStep: number;
  stepsCompleted: boolean[];
  flagsStatus: {
    promptApi: boolean;
    multimodalInput: boolean;
    optimizationGuide: boolean;
  };
  modelDownloadProgress: number;
  modelAvailable: boolean;
  userData: {
    name: string;
  };
}

interface OnboardingContextType {
  state: OnboardingState;
  goToStep: (step: number) => void;
  markStepComplete: (step: number) => void;
  updateFlagsStatus: (flags: Partial<OnboardingState['flagsStatus']>) => void;
  updateModelProgress: (progress: number) => void;
  setModelAvailable: (available: boolean) => void;
  updateUserData: (data: Partial<OnboardingState['userData']>) => void;
}
```

### IntroductionStep Component

Displays animated introduction with concept explanations:

```typescript
interface IntroductionStepProps {
  onContinue: () => void;
}
```

**Visual Design:**
- Hero section with NeuroPilot branding and tagline using `text-foreground` and `text-muted-foreground`
- Animated icons representing Attention (Eye icon) and Focus (Target icon) from lucide-react
- Card components using shadcn/ui Card with `bg-card` and `text-card-foreground`
- Smooth fade-in animations for each concept section
- Prominent shadcn/ui Button with `variant="default"` using `bg-primary` and `text-primary-foreground`

**Animations:**
- Fade-in-up for text sections using tw-animate-css
- Pulse animation for concept icons
- Smooth transitions between sections

### FlagsConfigurationStep Component

Checks and displays Chrome flags status:

```typescript
interface FlagsConfigurationStepProps {
  onContinue: () => void;
}

interface FlagItemProps {
  name: string;
  flagUrl: string;
  enabled: boolean;
}
```

**Visual Design:**
- shadcn/ui Card components for each flag with `bg-card` and `border-border`
- Status indicators using lucide-react icons (CheckCircle2 for enabled, AlertCircle for disabled)
- Color-coded status using theme colors: `text-chart-4` (green) for enabled, `text-chart-1` (amber) for disabled
- shadcn/ui Collapsible component for expandable instructions panel
- shadcn/ui Button with `variant="outline"` for flag links
- shadcn/ui Button with `variant="ghost"` and RefreshCw icon for re-check
- shadcn/ui Button with `variant="default"` for continue (disabled state using `disabled:opacity-50`)

**Flag Detection:**
Since direct flag detection isn't possible from web context, we'll use the Chrome AI API availability as a proxy:
- Check `window.ai?.languageModel` existence
- Check `window.ai?.languageModel.availability()` status
- Display instructions and trust user to enable flags, then verify via API availability

### ModelDownloadStep Component

Handles Gemini Nano model download:

```typescript
interface ModelDownloadStepProps {
  onContinue: () => void;
}

interface DownloadProgressProps {
  progress: number;
  status: 'idle' | 'downloading' | 'complete' | 'error';
}
```

**Visual Design:**
- shadcn/ui Card with model status using `bg-card` and `text-card-foreground`
- shadcn/ui Badge component for status indicator (`variant="default"` for ready, `variant="secondary"` for needs download)
- shadcn/ui Button with Download icon from lucide-react
- shadcn/ui Progress component with animated fill using `bg-primary`
- Text showing percentage using `text-muted-foreground`
- Success state with CheckCircle2 icon and `text-chart-4` (green)
- Error state using shadcn/ui Alert component with `variant="destructive"`
- shadcn/ui Button with `variant="outline"` for retry

**Implementation:**
```typescript
const downloadModel = async () => {
  try {
    const session = await window.ai.languageModel.create({
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          const progress = e.loaded / e.total * 100;
          updateModelProgress(progress);
        });
      },
    });
    setModelAvailable(true);
  } catch (error) {
    // Handle error
  }
};
```

### UserInfoStep Component

Collects user information:

```typescript
interface UserInfoStepProps {
  onComplete: () => void;
}

interface UserFormData {
  name: string;
}
```

**Visual Design:**
- shadcn/ui Card containing the form with `bg-card`
- shadcn/ui Label component for field labels using `text-foreground`
- shadcn/ui Input component with `bg-background`, `border-input`, and `ring-ring` focus state
- Validation errors displayed with `text-destructive` and `text-sm`
- shadcn/ui Button with loading state (Loader2 icon with spin animation)
- Success animation using CheckCircle2 icon with scale-in animation

**Form Validation:**
- Name required (min 1 character)
- Trim whitespace
- Display validation errors inline below input

### ProgressIndicator Component

Shows overall progress through onboarding:

```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}
```

**Visual Design:**
- Horizontal step indicator at top with `bg-muted` background
- Numbered circles using `bg-primary` for current, `bg-muted` for incomplete, `bg-chart-4` for complete
- Progress line using `bg-border` with filled portion using `bg-primary`
- Step labels using `text-foreground` for current, `text-muted-foreground` for others
- Completed steps with CheckCircle2 icon from lucide-react

## Data Models

### Chrome AI Types

```typescript
interface AILanguageModel {
  availability(): Promise<'readily' | 'after-download' | 'no'>;
  create(options?: {
    monitor?: (monitor: AIModelMonitor) => void;
  }): Promise<AILanguageModelSession>;
}

interface AIModelMonitor extends EventTarget {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: DownloadProgressEvent) => void
  ): void;
}

interface DownloadProgressEvent extends Event {
  loaded: number;
  total: number;
}

interface AILanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy(): void;
}

declare global {
  interface Window {
    ai?: {
      languageModel: AILanguageModel;
    };
  }
}
```

### Local Storage Schema

```typescript
interface OnboardingStorage {
  completed: boolean;
  completedAt?: string;
  userName?: string;
}

// Key: 'neuropilot:onboarding'
```

## Error Handling

### Chrome AI Not Available

**Scenario:** User's browser doesn't support Chrome AI
**Handling:**
- Display clear error message explaining Chrome AI requirement
- Show minimum Chrome version requirement (Chrome 127+)
- Provide link to Chrome download/update
- Offer alternative: "Check back after updating Chrome"

### Flags Not Enabled

**Scenario:** User hasn't enabled required flags
**Handling:**
- Show which specific flags are missing
- Provide step-by-step instructions with screenshots
- Offer "Refresh Status" button to re-check
- Block progression until flags are enabled

### Model Download Failure

**Scenario:** Network error or insufficient storage during download
**Handling:**
- Display specific error message
- Show retry button
- Provide troubleshooting tips:
  - Check internet connection
  - Ensure sufficient disk space (~1-2GB)
  - Try closing other tabs
- Allow user to retry download

### Form Submission Error

**Scenario:** Error saving user data
**Handling:**
- Display error message
- Preserve form data
- Offer retry button
- Log error for debugging

## Testing Strategy

### Unit Tests

1. **OnboardingContext Tests**
   - State initialization
   - Step navigation
   - State updates
   - Completion tracking

2. **Component Tests**
   - IntroductionStep: Renders content, handles continue action
   - FlagsConfigurationStep: Displays flag status, handles refresh
   - ModelDownloadStep: Initiates download, tracks progress, handles errors
   - UserInfoStep: Form validation, submission handling
   - ProgressIndicator: Displays correct step, updates on navigation

### Integration Tests

1. **Full Onboarding Flow**
   - Navigate through all steps
   - Verify state persistence
   - Test back navigation
   - Verify completion triggers redirect

2. **Chrome AI Integration**
   - Mock Chrome AI API
   - Test model availability check
   - Test download progress tracking
   - Test error scenarios

3. **Form Submission**
   - Test successful submission
   - Test validation errors
   - Test API integration with setUserName mutation

### Visual/Animation Tests

1. **Animation Timing**
   - Verify smooth transitions
   - Test animation completion
   - Check for animation conflicts

2. **Responsive Design**
   - Test on different viewport sizes
   - Verify mobile layout
   - Check touch interactions

## Animation Specifications

### Introduction Animations

- **Hero Section**: Fade-in with scale (0.95 → 1.0) over 600ms
- **Concept Cards**: Staggered fade-in-up, 200ms delay between each
- **Icons**: Continuous subtle pulse animation (scale 1.0 → 1.05)
- **CTA Button**: Hover scale effect (1.0 → 1.02)

### Step Transitions

- **Step Change**: Fade-out current (300ms) → Fade-in next (300ms)
- **Progress Indicator**: Smooth line fill animation (400ms ease-in-out)

### Status Indicators

- **Flag Enabled**: Checkmark with bounce animation
- **Flag Disabled**: Warning icon with shake animation
- **Model Download**: Progress bar fill with gradient animation
- **Success State**: Checkmark with scale-in and rotation

### Form Interactions

- **Input Focus**: Border color transition (200ms)
- **Validation Error**: Shake animation + color change
- **Submit Success**: Button → Checkmark morph animation

## Technical Considerations

### Browser Compatibility

- Requires Chrome 127+ with Chrome AI support
- Graceful degradation for unsupported browsers
- Feature detection before attempting Chrome AI operations

### Performance

- Lazy load animation library
- Optimize re-renders with React.memo
- Debounce flag status checks
- Use CSS transforms for animations (GPU acceleration)

### Accessibility

- Keyboard navigation support
- ARIA labels for all interactive elements
- Focus management between steps
- Screen reader announcements for status changes
- Reduced motion support (prefers-reduced-motion)

### Security

- Sanitize user input (name field)
- No sensitive data in localStorage
- Validate all form inputs client-side
- Handle API errors gracefully

## Future Enhancements

- Add more user preferences in step 3 (theme, notification settings)
- Include a quick tutorial/demo mode
- Add skip option for returning users
- Implement analytics tracking for drop-off points
- Add multi-language support
