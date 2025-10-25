# Design Document: Focus Popup UI

## Overview

The Focus Popup UI is a Chrome extension popup that provides users with an at-a-glance view of their current focus state, historical focus activities, and a gamified tree animation that grows with accumulated focus time. The design prioritizes visual delight, accessibility, and performance within the constraints of a Chrome extension popup environment.

The popup serves as the primary interface for quick interactions, while providing a gateway to a more detailed full-page view for extended engagement. The design leverages React, Tailwind CSS, Framer Motion for animations, and Rive for the tree animation to create a polished, modern user experience.

**Key Design Principles:**
- **Accessibility First**: Full keyboard navigation, ARIA labels, and screen reader support
- **Performance**: Fast load times (<500ms), efficient rendering, minimal bundle size
- **Visual Hierarchy**: Clear information architecture with progressive disclosure
- **Gamification**: Tree animation provides motivational feedback
- **Incremental Development**: Stub methods with TODOs for phased implementation

## Architecture

### Component Hierarchy

```
App (Root)
├── PopupContainer (Main Layout)
│   ├── Header
│   │   ├── Logo/Title
│   │   └── ActionButtons
│   │       └── TimeOnPageIndicator
│   ├── CurrentFocusSection
│   │   ├── FocusDisplay
│   │   │   ├── FocusText
│   │   │   └── TotalFocusTime
│   │   └── PomodoroTimer
│   │       ├── PomodoroIcon (dynamic)
│   │       └── PomodoroTimeDisplay
│   ├── TreeAnimationSection
│   │   └── RiveTreeAnimation
│   ├── FocusHistorySection
│   │   └── FocusHistoryList
│   │       └── FocusHistoryItem (x5, with progressive opacity)
│   ├── WinsSection
│   │   └── WinsList
│   │       └── WinItem (x2-3)
│   └── Footer
│       └── FullPageViewButton
```

### Technology Stack

- **React 19**: UI framework (already in package.json)
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling (already configured)
- **Framer Motion**: Smooth animations and transitions
- **@rive-app/react-webgl2**: Tree animation rendering
- **Lucide React**: Icon library (already in package.json)
- **Chrome Extension APIs**: For extension-specific functionality

### Data Flow

```
┌─────────────────┐
│   Popup Opens   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Initialize Data Fetching       │
│  - getCurrentFocusData()        │
│  - getFocusHistory()            │
│  - getWinsData()                │
│  - getPomodoroState()           │
│  - getCurrentTabTime()          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Update Component State         │
│  - Focus data                   │
│  - History items                │
│  - Wins                         │
│  - Pomodoro timer               │
│  - Tree growth stage            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Render UI Components           │
│  - Display current focus        │
│  - Animate tree based on time   │
│  - Show history with opacity    │
│  - Display wins                 │
└─────────────────────────────────┘
```

## Components and Interfaces

### 1. PopupContainer Component

**Purpose**: Main container that manages layout and overall popup structure

**Props**: None (root component)

**State**:
```typescript
interface PopupState {
  currentFocus: FocusData | null;
  focusHistory: FocusHistoryItem[];
  wins: WinItem[];
  pomodoroState: PomodoroState;
  currentTabTime: number;
  isLoading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Fetch all data on mount
- Manage global popup state
- Handle error boundaries
- Coordinate data refresh intervals

**Accessibility**:
- Set initial focus to main content area
- Provide skip links if needed
- Announce loading states via ARIA live regions

---

### 2. CurrentFocusSection Component

**Purpose**: Display the active focus item and accumulated time

**Props**:
```typescript
interface CurrentFocusSectionProps {
  focusData: FocusData | null;
  isLoading: boolean;
}
```

**Data Structure**:
```typescript
interface FocusData {
  focusItem: string;
  totalFocusTime: number; // milliseconds
  keywords: string[];
  isActive: boolean;
}
```

**UI States**:
- **Active Focus**: Show focus text + time in HH:MM:SS format
- **No Focus**: Show placeholder "Start focusing to see your progress"
- **Loading**: Show skeleton loader

**Styling**:
- Large, prominent text for focus item (text-2xl, font-semibold)
- Monospace font for time display
- Subtle background card with rounded corners
- Smooth fade-in animation on load

**Accessibility**:
- Use `<h1>` or `<h2>` for focus item
- ARIA live region for time updates (polite)
- Descriptive text for screen readers

---

### 3. PomodoroTimer Component

**Purpose**: Display and control Pomodoro timer

**Props**:
```typescript
interface PomodoroTimerProps {
  pomodoroState: PomodoroState;
  onToggle: () => void;
}
```

**Data Structure**:
```typescript
interface PomodoroState {
  isActive: boolean;
  remainingTime: number; // seconds
  state: 'idle' | 'focus' | 'break';
}
```

**UI Elements**:
- Dynamic icon (play/pause/coffee) based on state
- Time display in MM:SS format
- Circular progress indicator (optional)
- Hover/focus states

**Interactions**:
- Click or Enter/Space to toggle timer
- Visual feedback on state change
- Sound notification on completion (optional)

**Accessibility**:
- Button with descriptive label: "Start Pomodoro timer" / "Stop Pomodoro timer"
- ARIA live region for time announcements (every minute, not every second)
- Focus indicator on button

---

### 4. TreeAnimationSection Component

**Purpose**: Render Rive tree animation that grows with focus time

**Props**:
```typescript
interface TreeAnimationSectionProps {
  totalFocusTime: number; // milliseconds
}
```

**Rive Integration**:
```typescript
import { useRive, UseRiveParameters } from '@rive-app/react-webgl2';

const treeAnimationConfig: UseRiveParameters = {
  src: '/animations/focus-tree.riv', // Rive file path
  autoplay: true,
  stateMachines: 'TreeGrowth', // State machine name
  artboard: 'FocusTree',
};
```

**Growth Stages** (mapped to focus time):
- **Seed** (0-15 min): Small seed/sprout
- **Sapling** (15-60 min): Young tree with few leaves
- **Growing** (60-180 min): Medium tree with more branches
- **Mature** (180+ min): Full, lush tree

**State Mapping Logic**:
```typescript
function getTreeGrowthStage(totalTimeMs: number): number {
  const minutes = totalTimeMs / (1000 * 60);
  if (minutes < 15) return 0;      // Seed
  if (minutes < 60) return 0.33;   // Sapling
  if (minutes < 180) return 0.66;  // Growing
  return 1.0;                      // Mature
}
```

**Error Handling**:
- Fallback to static SVG tree if Rive fails to load
- Loading state while animation initializes
- Graceful degradation for unsupported browsers

**Accessibility**:
- Hidden from screen readers (decorative)
- Alternative text description: "Tree animation showing focus progress"
- Respects `prefers-reduced-motion`

---

### 5. FocusHistorySection Component

**Purpose**: Display last 5 focus items with progressive opacity

**Props**:
```typescript
interface FocusHistorySectionProps {
  historyItems: FocusHistoryItem[];
  isLoading: boolean;
}
```

**Data Structure**:
```typescript
interface FocusHistoryItem {
  id: string;
  focusItem: string;
  timestamp: number;
  duration: number; // milliseconds
  keywords: string[];
}
```

**Visual Design**:
- Vertical list of 5 items
- Progressive opacity: 100% → 80% → 60% → 40% → 20%
- Each item shows: focus text + time ago + duration
- Smooth fade-in animation on load

**Opacity Calculation**:
```typescript
function getOpacityForIndex(index: number, total: number): number {
  return 1 - (index * 0.2); // 100%, 80%, 60%, 40%, 20%
}
```

**Empty State**:
- Show message: "No focus history yet. Start focusing to build your history!"

**Accessibility**:
- Use `<ul>` and `<li>` for semantic structure
- Each item has descriptive text for screen readers
- Heading: "Recent Focus Activities"

---

### 6. WinsSection Component

**Purpose**: Display recent achievements and wins

**Props**:
```typescript
interface WinsSectionProps {
  wins: WinItem[];
  isLoading: boolean;
}
```

**Data Structure**:
```typescript
interface WinItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'milestone' | 'streak' | 'achievement';
}
```

**UI Design**:
- Compact list of 2-3 recent wins
- Badge or icon for win type
- Timestamp (e.g., "5 minutes ago")
- Celebratory micro-animation on new win

**Empty State**:
- Show message: "Keep focusing to earn your first win!"

**Accessibility**:
- Semantic list structure
- Descriptive labels for win types
- Heading: "Recent Wins"

---

### 7. ActionButtons Component

**Purpose**: Display time on current page and quick actions

**Props**:
```typescript
interface ActionButtonsProps {
  currentTabTime: number; // seconds
}
```

**UI Elements**:
- Time display: "On this page: MM:SS"
- Icon buttons for quick actions (future expansion)
- Compact, non-intrusive design

**Accessibility**:
- Clear labels for all buttons
- Time display with ARIA live region (polite)

---

### 8. FullPageViewButton Component

**Purpose**: Navigate to full-page view

**Props**: None

**Interaction**:
```typescript
function openFullPageView() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('full-page.html')
  });
}
```

**UI Design**:
- Prominent button at bottom of popup
- Text: "Open Full View" or "Explore More"
- Icon indicating external navigation
- Hover/focus states

**Accessibility**:
- Button with descriptive label
- Keyboard accessible (Tab + Enter)
- Focus indicator

## Data Models

### Focus Data Model

```typescript
interface FocusData {
  focusItem: string;
  totalFocusTime: number; // milliseconds
  keywords: string[];
  isActive: boolean;
  lastUpdated: number; // timestamp
}
```

### Focus History Item Model

```typescript
interface FocusHistoryItem {
  id: string;
  focusItem: string;
  timestamp: number;
  duration: number; // milliseconds
  keywords: string[];
}
```

### Pomodoro State Model

```typescript
interface PomodoroState {
  isActive: boolean;
  remainingTime: number; // seconds
  state: 'idle' | 'focus' | 'break';
  totalPomodoros: number;
}
```

### Win Item Model

```typescript
interface WinItem {
  id: string;
  text: string;
  timestamp: number;
  type: 'milestone' | 'streak' | 'achievement';
}
```

## API Layer

### Data Fetching Methods

All methods will be implemented in a `src/frontend/pages/popup/src/api/` directory.

#### 1. getCurrentFocusData()

```typescript
/**
 * Fetch current focus data
 * TODO: Integrate with actual API
 */
export async function getCurrentFocusData(): Promise<FocusData | null> {
  // Hardcoded for initial development
  return {
    focusItem: "Learning about Figma",
    totalFocusTime: 7392000, // 2:03:12 in milliseconds
    keywords: ["Figma", "design", "UI"],
    isActive: true,
    lastUpdated: Date.now(),
  };
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_CURRENT_FOCUS'
  // });
  // return response.data;
}
```

#### 2. getFocusHistory()

```typescript
/**
 * Fetch last 5 focus items
 * TODO: Integrate with actual API
 */
export async function getFocusHistory(): Promise<FocusHistoryItem[]> {
  // TODO: Implement actual API call
  return [];
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_FOCUS_HISTORY',
  //   limit: 5
  // });
  // return response.data;
}
```

#### 3. getWinsData()

```typescript
/**
 * Fetch recent wins
 * TODO: Integrate with actual API
 */
export async function getWinsData(): Promise<WinItem[]> {
  // TODO: Implement actual API call
  return [];
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_WINS',
  //   limit: 3
  // });
  // return response.data;
}
```

#### 4. getPomodoroState()

```typescript
/**
 * Fetch current Pomodoro state
 * TODO: Integrate with actual API
 */
export async function getPomodoroState(): Promise<PomodoroState> {
  // TODO: Implement actual API call
  return {
    isActive: false,
    remainingTime: 1500, // 25 minutes
    state: 'idle',
    totalPomodoros: 0,
  };
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_POMODORO_STATE'
  // });
  // return response.data;
}
```

#### 5. togglePomodoro()

```typescript
/**
 * Toggle Pomodoro timer
 * TODO: Integrate with actual API
 */
export async function togglePomodoro(): Promise<void> {
  // TODO: Implement actual API call
  console.log('Toggle Pomodoro - TODO');
  
  // TODO: Replace with actual implementation
  // await chrome.runtime.sendMessage({
  //   type: 'TOGGLE_POMODORO'
  // });
}
```

#### 6. getCurrentTabTime()

```typescript
/**
 * Get time spent on current tab
 * TODO: Integrate with actual API
 */
export async function getCurrentTabTime(): Promise<number> {
  // TODO: Implement actual API call
  return 0;
  
  // TODO: Replace with actual implementation
  // const response = await chrome.runtime.sendMessage({
  //   type: 'GET_CURRENT_TAB_TIME'
  // });
  // return response.data;
}
```

### Chrome Extension Message Passing

The popup will communicate with the background script using Chrome's message passing API:

```typescript
// Send message to background
chrome.runtime.sendMessage(
  { type: 'ACTION_TYPE', payload: data },
  (response) => {
    // Handle response
  }
);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_TYPE') {
    // Update UI
  }
});
```

## Error Handling

### Error Boundary Component

```typescript
class PopupErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Popup error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <p>Something went wrong. Please refresh the popup.</p>
          <button onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
async function fetchWithErrorHandling<T>(
  fetchFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    console.error('API error:', error);
    return fallback;
  }
}
```

### Loading States

- Skeleton loaders for each section
- Shimmer effect for loading content
- Timeout after 5 seconds with error message

### Empty States

- Friendly messages for each section when no data
- Call-to-action to encourage user engagement
- Consistent visual design

## Testing Strategy

### Unit Tests

**Components to Test**:
- CurrentFocusSection: rendering with different states
- FocusHistoryList: opacity calculation, empty state
- PomodoroTimer: state transitions, time formatting
- TreeAnimationSection: growth stage calculation

**Test Framework**: Vitest + React Testing Library

**Example Test**:
```typescript
describe('CurrentFocusSection', () => {
  it('displays focus item and time correctly', () => {
    const focusData = {
      focusItem: 'Test Focus',
      totalFocusTime: 3600000, // 1 hour
      keywords: [],
      isActive: true,
      lastUpdated: Date.now(),
    };
    
    render(<CurrentFocusSection focusData={focusData} isLoading={false} />);
    
    expect(screen.getByText('Test Focus')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument();
  });
  
  it('shows placeholder when no focus', () => {
    render(<CurrentFocusSection focusData={null} isLoading={false} />);
    
    expect(screen.getByText(/start focusing/i)).toBeInTheDocument();
  });
});
```

### Integration Tests

- Test data flow from API to UI
- Test Pomodoro timer interactions
- Test navigation to full-page view
- Test keyboard navigation flow

### Accessibility Tests

- Automated: axe-core via jest-axe
- Manual: keyboard navigation testing
- Screen reader testing (NVDA/JAWS/VoiceOver)

**Example Accessibility Test**:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Performance Tests

- Measure initial render time (<500ms)
- Monitor bundle size (<200KB)
- Test animation performance (60fps)

## Styling and Theming

### Tailwind Configuration

Use existing Tailwind setup with custom extensions:

```typescript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
};
```

### Color Palette

- **Primary**: Existing brand colors
- **Focus State**: Blue (#3B82F6)
- **Success**: Green (#10B981) for wins
- **Neutral**: Gray scale for history items
- **Background**: Light gray (#F9FAFB) or white

### Typography

- **Headings**: font-semibold, text-lg to text-2xl
- **Body**: font-normal, text-sm to text-base
- **Time Display**: font-mono for consistent width
- **Focus Item**: font-semibold, text-2xl

### Spacing

- **Popup Size**: 400px width × 600px height
- **Padding**: p-4 to p-6 for sections
- **Gap**: gap-4 between sections
- **Margins**: mb-2 to mb-4 between elements

## Performance Optimization

### Bundle Size

- Code splitting for Rive animation (lazy load)
- Tree shaking for unused Lucide icons
- Minimize dependencies

### Rendering Optimization

- React.memo for expensive components
- useMemo for calculations (tree growth stage, opacity)
- useCallback for event handlers
- Debounce time updates (1 second interval)

### Animation Performance

- Use CSS transforms for animations (GPU accelerated)
- Limit Rive animation complexity
- Respect `prefers-reduced-motion`

### Data Fetching

- Fetch all data in parallel on mount
- Cache data in state
- Refresh only when popup reopens
- Debounce rapid updates

## Accessibility Implementation

### Keyboard Navigation

**Tab Order**:
1. Main content area (skip link target)
2. Pomodoro toggle button
3. Focus history items (if interactive)
4. Full-page view button

**Keyboard Shortcuts**:
- `Tab`: Move forward through interactive elements
- `Shift+Tab`: Move backward
- `Enter/Space`: Activate buttons
- `Escape`: Close popup (browser default)

### ARIA Labels and Roles

```typescript
// Example ARIA implementation
<div role="region" aria-label="Current Focus">
  <h2 id="focus-heading">Current Focus</h2>
  <p aria-live="polite" aria-atomic="true">
    {focusItem} - {formatTime(totalFocusTime)}
  </p>
</div>

<button
  aria-label={pomodoroState.isActive ? 'Stop Pomodoro timer' : 'Start Pomodoro timer'}
  aria-pressed={pomodoroState.isActive}
>
  <PomodoroIcon />
</button>

<ul aria-label="Recent Focus Activities">
  {historyItems.map(item => (
    <li key={item.id}>
      {item.focusItem} - {formatDuration(item.duration)}
    </li>
  ))}
</ul>
```

### Screen Reader Announcements

- Use `aria-live="polite"` for time updates
- Announce Pomodoro state changes
- Announce new wins
- Provide context for tree animation

### Focus Management

- Set initial focus to main content
- Visible focus indicators (outline, ring)
- Focus trap within popup (browser handles)
- Restore focus on return from full-page view

### Color Contrast

- Ensure WCAG AA compliance (4.5:1 for text)
- Test with color blindness simulators
- Don't rely solely on color for information

## Implementation Phases

### Phase 1: Core Structure (MVP)
- PopupContainer with basic layout
- CurrentFocusSection with hardcoded data
- Basic styling with Tailwind
- Keyboard navigation

### Phase 2: Tree Animation
- Integrate @rive-app/react-webgl2
- Implement tree growth logic
- Add fallback for animation failures
- Performance optimization

### Phase 3: History and Wins
- FocusHistorySection with progressive opacity
- WinsSection with empty states
- Loading states and skeletons

### Phase 4: Pomodoro Integration
- PomodoroTimer component
- Timer state management
- Visual feedback and animations

### Phase 5: Polish and Accessibility
- Comprehensive ARIA labels
- Screen reader testing
- Animation refinements
- Error handling improvements

### Phase 6: API Integration
- Replace hardcoded data with actual API calls
- Implement Chrome message passing
- Real-time updates
- Error handling for API failures

## Dependencies to Add

```json
{
  "dependencies": {
    "@rive-app/react-webgl2": "^4.0.0"
  }
}
```

All other dependencies (React, Tailwind, Framer Motion, Lucide) are already present in the package.json.

## Diagrams

### Component Layout

```
┌─────────────────────────────────────┐
│           Header / Logo             │
│      [Time on Page: 02:30]          │
├─────────────────────────────────────┤
│                                     │
│      Current Focus Section          │
│   ┌───────────────────────────┐    │
│   │  Learning about Figma     │    │
│   │       02:03:12            │    │
│   │  [🍅 Pomodoro: 03:30]     │    │
│   └───────────────────────────┘    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Tree Animation Section         │
│         🌳 (Rive Animation)         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│      Focus History (Last 5)         │
│   • Reading laws... (100%)          │
│   • Historic Judicial... (80%)      │
│   • You were reading... (60%)       │
│   • You were watching... (40%)      │
│   • You were watching... (20%)      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│           Wins Section              │
│   🏆 ABC 5:30                       │
│   🎯 DEF6Y2 22:45                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   [Open Full View →]                │
│                                     │
└─────────────────────────────────────┘
```

### State Management Flow

```
User Opens Popup
       │
       ▼
Initialize State
       │
       ├─→ Fetch Current Focus ──→ Update State
       ├─→ Fetch History ────────→ Update State
       ├─→ Fetch Wins ───────────→ Update State
       ├─→ Fetch Pomodoro ───────→ Update State
       └─→ Fetch Tab Time ───────→ Update State
       │
       ▼
Render Components
       │
       ├─→ User Toggles Pomodoro ──→ Update State ──→ Re-render
       ├─→ Time Updates ───────────→ Update State ──→ Re-render
       └─→ User Opens Full View ───→ Navigate
```

## Security Considerations

- Sanitize all user-generated content (focus items, wins)
- Use Content Security Policy (CSP) for extension
- Validate all data from background script
- No inline scripts or styles (CSP compliance)
- Secure message passing between popup and background

## Future Enhancements

- Dark mode support
- Customizable tree animations
- Focus streak visualization
- Quick focus switching
- Keyboard shortcuts for actions
- Export focus data
- Integration with calendar/task apps
