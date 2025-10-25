# Design Document: Pinnacle Dashboard

## Overview

The Pinnacle Dashboard is a full-screen productivity interface that provides users with a comprehensive view of their focus activities, statistics, AI chat capabilities, knowledge quizzes, and pulse insights. Unlike the popup extension which provides quick glances, Pinnacle serves as a dedicated workspace for deep engagement with productivity data and AI assistance.

The dashboard will be built using React 19 with TypeScript, leveraging the existing `neuropilot-api` workspace package for data access. The UI will use Tailwind CSS for styling with Framer Motion for animations, maintaining consistency with the existing popup interface while providing a more expansive, desktop-optimized experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Pinnacle Dashboard                        │
│                     (React App)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Header     │  │  Focus State │  │    Stats     │     │
│  │  Component   │  │   Component  │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Chat     │  │     Quiz     │  │    Pulse     │     │
│  │  Component   │  │  Component   │  │  Component   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    API Layer (Hooks)                         │
├─────────────────────────────────────────────────────────────┤
│                  neuropilot-api Package                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Focus   │  │   Wins   │  │   Quiz   │  │  Pulse   │  │
│  │   API    │  │   API    │  │   API    │  │   API    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    IndexedDB Storage                         │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Framework**: React 19.1.1 with TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 4.1.16
- **Animation**: Framer Motion 12.23.24
- **Icons**: Lucide React 0.546.0
- **Data Access**: neuropilot-api (workspace package)
- **State Management**: React hooks (useState, useEffect, useCallback, useMemo)
- **UI Components**: Custom components with Radix UI primitives

## Components and Interfaces

### 1. App Component (`App.tsx`)

**Purpose**: Root component that orchestrates the entire dashboard layout and manages global state.

**State Management**:
```typescript
interface AppState {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  wins: WinWithParsedData[];
  pulses: Pulse[];
  quizQuestions: QuizQuestion[];
  activitySummary: ActivitySummary | null;
  isLoading: boolean;
  currentTime: Date;
}
```

**Layout Structure**:
- Grid-based layout optimized for desktop (1200px+ width)
- Responsive breakpoints for tablet and smaller screens
- Five main sections arranged according to the wireframe
- Header with user greeting, settings, theme toggle, and time

### 2. Header Component (`components/Header.tsx`)

**Purpose**: Display user information, current time, and global controls.

**Interface**:
```typescript
interface HeaderProps {
  userName: string;
  currentTime: Date;
  onSettingsClick: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}
```

**Features**:
- User greeting with emoji wave
- Real-time clock display (updates every second)
- Settings button (opens modal or navigates to settings page)
- Theme toggle (light/dark mode)
- "Take a break" suggestion based on focus duration

### 3. Focus State Component (`components/FocusStateSection.tsx`)

**Purpose**: Display the current focus state with contextual messaging based on user activity.

**Interface**:
```typescript
interface FocusStateSectionProps {
  currentFocus: FocusWithParsedData | null;
  focusHistory: FocusWithParsedData[];
  totalDailyFocusTime: number;
  isNightTime: boolean;
}

type FocusState = 'no-focus' | 'active-focus' | 'wind-down';
```

**State Logic**:
```typescript
function determineFocusState(
  currentFocus: FocusWithParsedData | null,
  totalDailyFocusTime: number,
  isNightTime: boolean
): FocusState {
  if (!currentFocus && focusHistory.length === 0) {
    return 'no-focus';
  }
  
  const WIND_DOWN_THRESHOLD = 6 * 60 * 60 * 1000; // 6 hours
  const NIGHT_START_HOUR = 20; // 8 PM
  
  if (totalDailyFocusTime >= WIND_DOWN_THRESHOLD && isNightTime) {
    return 'wind-down';
  }
  
  return 'active-focus';
}
```

**Display States**:
1. **No Focus**: Encouraging message to start focusing
2. **Active Focus**: Current focus item with real-time elapsed time
3. **Wind Down**: Congratulatory message suggesting rest

### 4. Statistics Component (`components/StatsSection.tsx`)

**Purpose**: Display weekly and daily focus statistics with visual representations.

**Interface**:
```typescript
interface StatsSectionProps {
  focusHistory: FocusWithParsedData[];
  wins: WinWithParsedData[];
  activitySummary: ActivitySummary | null;
}

interface StatsData {
  primeActivity: {
    name: string;
    totalTime: number;
    percentage: number;
  } | null;
  dailyTotal: number;
  weeklyTotal: number;
  topActivities: Array<{
    name: string;
    time: number;
  }>;
}
```

**Features**:
- Prime activity display (block 1 in wireframe)
- Week vs Day toggle (block 2 in wireframe)
- Bar chart or progress visualization for top activities
- Time formatting in hours and minutes
- Empty state when no data available

**Data Calculation**:
```typescript
function calculateStats(
  focusHistory: FocusWithParsedData[],
  wins: WinWithParsedData[]
): StatsData {
  // Calculate daily total (last 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const dailyFocus = focusHistory.filter(f => f.last_updated >= oneDayAgo);
  
  // Calculate weekly total (last 7 days)
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyFocus = focusHistory.filter(f => f.last_updated >= oneWeekAgo);
  
  // Aggregate by focus item
  const activityMap = new Map<string, number>();
  weeklyFocus.forEach(focus => {
    const current = activityMap.get(focus.focus_item) || 0;
    activityMap.set(focus.focus_item, current + focus.total_time);
  });
  
  // Find prime activity
  const topActivities = Array.from(activityMap.entries())
    .map(([name, time]) => ({ name, time }))
    .sort((a, b) => b.time - a.time);
  
  return {
    primeActivity: topActivities[0] ? {
      name: topActivities[0].name,
      totalTime: topActivities[0].time,
      percentage: (topActivities[0].time / weeklyTotal) * 100
    } : null,
    dailyTotal: dailyFocus.reduce((sum, f) => sum + f.total_time, 0),
    weeklyTotal: weeklyFocus.reduce((sum, f) => sum + f.total_time, 0),
    topActivities: topActivities.slice(0, 5)
  };
}
```

### 5. Chat Interface Component (`components/ChatSection.tsx`)

**Purpose**: Provide AI chat functionality for productivity insights and assistance.

**Interface**:
```typescript
interface ChatSectionProps {
  focusContext: {
    currentFocus: FocusWithParsedData | null;
    recentActivities: FocusWithParsedData[];
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
```

**Features**:
- Message history display with scrollable area
- Input field with send button
- Loading indicator while AI responds
- Error handling and retry mechanism
- Context-aware suggestions based on current focus
- Message persistence (stored in component state, could be extended to IndexedDB)

**API Integration**:
```typescript
// Note: Chat API endpoints need to be implemented
async function sendChatMessage(message: string): Promise<string> {
  // TODO: Implement actual chat API call
  // For now, this will be a placeholder that needs backend implementation
  throw new Error('Chat API not yet implemented');
}
```

### 6. Quiz Component (`components/QuizSection.tsx`)

**Purpose**: Display knowledge recall quizzes and handle user answers.

**Interface**:
```typescript
interface QuizSectionProps {
  questions: QuizQuestion[];
  onAnswerSubmit: (questionId: string, answer: 1 | 2) => void;
}

interface QuizQuestion {
  id: string;
  question: string;
  option_1: string;
  option_2: string;
  correct_answer: 1 | 2;
  timestamp: number;
}

interface QuizState {
  answeredQuestions: Set<string>;
  currentQuestionIndex: number;
  showFeedback: boolean;
  isCorrect: boolean | null;
}
```

**Features**:
- Display one question at a time
- Two-option multiple choice interface
- Immediate feedback on answer selection
- Track answered questions to avoid re-display
- Progress indicator showing remaining questions
- Empty state when all questions are answered
- Celebration animation on correct answers

**Answer Tracking**:
```typescript
// Store answered questions in localStorage
const ANSWERED_QUESTIONS_KEY = 'pinnacle_answered_questions';

function getAnsweredQuestions(): Set<string> {
  const stored = localStorage.getItem(ANSWERED_QUESTIONS_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

function markQuestionAsAnswered(questionId: string): void {
  const answered = getAnsweredQuestions();
  answered.add(questionId);
  localStorage.setItem(ANSWERED_QUESTIONS_KEY, JSON.stringify([...answered]));
}

function filterUnansweredQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const answered = getAnsweredQuestions();
  return questions.filter(q => !answered.has(q.id));
}
```

### 7. Pulse Component (`components/PulseSection.tsx`)

**Purpose**: Visualize pulse data showing activity patterns and insights.

**Interface**:
```typescript
interface PulseSectionProps {
  pulses: Pulse[];
}

interface Pulse {
  id: string;
  message: string;
  timestamp: number;
}

interface PulseDisplayItem {
  message: string;
  timestamp: Date;
  category: 'insight' | 'reminder' | 'recap';
}
```

**Features**:
- List or card-based display of pulse messages
- Timestamp formatting (relative time: "2 hours ago")
- Visual categorization with icons/colors
- Smooth animations for new pulses
- Empty state when no pulses available
- Auto-refresh capability

**Visualization Options**:
1. **List View**: Simple chronological list with icons
2. **Card View**: Larger cards with more context
3. **Timeline View**: Visual timeline representation

### 8. Website Summaries Component (`components/WebsiteSummariesSection.tsx`)

**Purpose**: Display summaries of websites visited during focus sessions.

**Interface**:
```typescript
interface WebsiteSummariesProps {
  activitySummary: ActivitySummary | null;
}

interface ActivitySummary {
  id: string;
  summary: string;
  timestamp: number;
  focus_item: string;
}
```

**Features**:
- Collapsible section to save space
- Website title and brief summary
- Link to full details or original website
- Integration with focus activity context

### 9. Export Component (`components/ExportButton.tsx`)

**Purpose**: Allow users to export their focus data as CSV.

**Interface**:
```typescript
interface ExportButtonProps {
  focusHistory: FocusWithParsedData[];
  wins: WinWithParsedData[];
}
```

**CSV Generation**:
```typescript
function generateCSV(
  focusHistory: FocusWithParsedData[],
  wins: WinWithParsedData[]
): string {
  const headers = ['Date', 'Focus Item', 'Time Spent (hours)', 'Keywords', 'Type'];
  const rows: string[][] = [];
  
  // Add focus history
  focusHistory.forEach(focus => {
    rows.push([
      new Date(focus.last_updated).toISOString(),
      focus.focus_item,
      (focus.total_time / (1000 * 60 * 60)).toFixed(2),
      focus.keywords.join('; '),
      'Focus Session'
    ]);
  });
  
  // Add wins
  wins.forEach(win => {
    rows.push([
      new Date(win.recorded_at).toISOString(),
      win.focus_item,
      win.time_spent_hours.toString(),
      win.keywords.join('; '),
      'Win'
    ]);
  });
  
  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
```

## Data Models

### Focus Data Model
```typescript
interface FocusWithParsedData {
  id: string;
  focus_item: string;
  keywords: string[];
  time_spent: Array<{
    start: number;
    stop: number | null;
  }>;
  last_updated: number;
  total_time: number; // in milliseconds
}
```

### Win Data Model
```typescript
interface WinWithParsedData {
  id: string;
  focus_item: string;
  time_spent: number; // in milliseconds
  recorded_at: number;
  keywords: string[];
  time_spent_hours: number;
}
```

### Quiz Question Model
```typescript
interface QuizQuestion {
  id: string;
  question: string;
  option_1: string;
  option_2: string;
  correct_answer: 1 | 2;
  timestamp: number;
}
```

### Pulse Model
```typescript
interface Pulse {
  id: string;
  message: string;
  timestamp: number;
}
```

### Activity Summary Model
```typescript
interface ActivitySummary {
  id: string;
  summary: string;
  timestamp: number;
  focus_item: string;
}
```

## API Integration

### Custom Hooks for Data Fetching

#### `useFocusData` Hook
```typescript
function useFocusData() {
  const [currentFocus, setCurrentFocus] = useState<FocusWithParsedData | null>(null);
  const [focusHistory, setFocusHistory] = useState<FocusWithParsedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [current, history] = await Promise.all([
          getCurrentFocus(),
          getFocusData()
        ]);
        setCurrentFocus(current);
        setFocusHistory(history);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return { currentFocus, focusHistory, isLoading, error };
}
```

#### `useWinsData` Hook
```typescript
function useWinsData() {
  const [wins, setWins] = useState<WinWithParsedData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchWins() {
      try {
        const data = await getTopWins(10);
        setWins(data);
      } catch (err) {
        console.error('Error fetching wins:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWins();
  }, []);
  
  return { wins, isLoading };
}
```

#### `useQuizQuestions` Hook
```typescript
function useQuizQuestions() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [unansweredQuestions, setUnansweredQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const data = await getQuizQuestions();
        setQuestions(data);
        setUnansweredQuestions(filterUnansweredQuestions(data));
      } catch (err) {
        console.error('Error fetching quiz questions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchQuestions();
  }, []);
  
  const markAsAnswered = useCallback((questionId: string) => {
    markQuestionAsAnswered(questionId);
    setUnansweredQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);
  
  return { questions, unansweredQuestions, isLoading, markAsAnswered };
}
```

#### `usePulseData` Hook
```typescript
function usePulseData() {
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchPulses() {
      try {
        const data = await getPulses();
        setPulses(data);
      } catch (err) {
        console.error('Error fetching pulses:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPulses();
    
    // Refresh pulses every minute
    const interval = setInterval(fetchPulses, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return { pulses, isLoading };
}
```

## Error Handling

### Error Boundary Component
```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### API Error Handling Strategy
- Display user-friendly error messages
- Provide retry mechanisms for failed requests
- Show empty states when data is unavailable
- Log errors to console for debugging
- Graceful degradation (show partial data if some APIs fail)

## Testing Strategy

### Unit Testing
- Test utility functions (time formatting, CSV generation, stats calculation)
- Test custom hooks with mock data
- Test component rendering with different props
- Test state management logic

### Integration Testing
- Test data flow from API to components
- Test user interactions (quiz answers, chat messages)
- Test error scenarios and recovery

### Manual Testing Checklist
1. **Focus State Display**
   - Verify "no focus" state shows encouragement message
   - Verify active focus shows correct item and time
   - Verify wind-down message appears at night after 6+ hours
   - Verify real-time time updates

2. **Statistics Section**
   - Verify prime activity calculation is correct
   - Verify daily vs weekly toggle works
   - Verify empty state displays when no data
   - Verify time formatting is human-readable

3. **Chat Interface**
   - Verify messages send and display correctly
   - Verify loading states during API calls
   - Verify error handling and retry
   - Verify message history persists

4. **Quiz Section**
   - Verify only unanswered questions display
   - Verify answer feedback is immediate
   - Verify answered questions don't reappear
   - Verify empty state when all answered

5. **Pulse Section**
   - Verify pulses display from API
   - Verify no mock data is used
   - Verify timestamps format correctly
   - Verify empty state displays appropriately

6. **Export Functionality**
   - Verify CSV generates with correct data
   - Verify download triggers in browser
   - Verify CSV format is valid

### Performance Testing
- Measure initial load time
- Test with large datasets (100+ focus sessions)
- Monitor memory usage during long sessions
- Test animation performance

## UI/UX Design Principles

### Layout Design
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Hi user 👋  |  Website Summaries  |  ⚙️ 🌙 20:11  │
├──────────────────┬──────────────────┬──────────────────────┤
│                  │                  │                       │
│  Focus State     │  Prime Activity  │   Knowledge Recalls   │
│  (Block 1)       │  (Stats Block 1) │   Quiz (Block 4)      │
│                  │                  │                       │
├──────────────────┤                  ├──────────────────────┤
│                  │                  │                       │
│  Week/Day Stats  │                  │   Pulse Data          │
│  (Block 2)       │                  │   (Block 5)           │
│                  │                  │                       │
├──────────────────┴──────────────────┴──────────────────────┤
│                                                              │
│                    Chat Interface                            │
│                      (Block 3)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints
- **Desktop (1200px+)**: Full grid layout as shown
- **Tablet (768px - 1199px)**: 2-column layout, chat moves to bottom
- **Mobile (< 768px)**: Single column, stacked sections

### Color Scheme
- **Primary**: Blue (#3B82F6) for focus and active states
- **Success**: Green (#10B981) for wins and correct answers
- **Warning**: Orange (#F59E0B) for wind-down suggestions
- **Error**: Red (#EF4444) for errors
- **Neutral**: Gray scale for backgrounds and text

### Typography
- **Headings**: Font weight 700, larger sizes
- **Body**: Font weight 400, readable sizes (14-16px)
- **Monospace**: For time displays and data values

### Animations
- **Page Load**: Fade in with stagger effect for sections
- **Data Updates**: Smooth transitions, no jarring changes
- **Interactions**: Hover effects, button presses
- **Quiz Feedback**: Celebration animation for correct answers

### Accessibility
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast (WCAG AA)
- Focus indicators for keyboard users

## Implementation Notes

### Chat API Implementation
The chat functionality requires backend API endpoints that are currently not implemented. The design includes placeholders for:
- `sendChatMessage(message: string): Promise<string>`
- `getChatMessages(): Promise<ChatMessage[]>`

These will need to be implemented in the `src/api/mutations/send-chat-message.ts` and `src/api/queries/chat-messages.ts` files respectively.

### Time Calculations
All time values from the API are in milliseconds. The dashboard will use utility functions to convert to human-readable formats:
- Hours and minutes for display
- Relative time for timestamps ("2 hours ago")
- Real-time updates for active focus sessions

### Data Refresh Strategy
- **Focus Data**: Poll every 5 seconds when active focus exists
- **Wins Data**: Fetch once on load, refresh on user action
- **Quiz Questions**: Fetch once on load
- **Pulse Data**: Poll every 60 seconds
- **Activity Summary**: Fetch once on load

### Local Storage Usage
- Answered quiz questions: Persist to avoid re-showing
- Theme preference: Dark/light mode selection
- User preferences: Any customization settings

### Future Enhancements
1. **Real-time Updates**: WebSocket connection for live data
2. **Advanced Analytics**: Charts and graphs for trends
3. **Goal Setting**: Allow users to set daily/weekly focus goals
4. **Notifications**: Browser notifications for breaks and achievements
5. **Data Sync**: Cloud sync across devices
6. **Customizable Layout**: Drag-and-drop section arrangement
7. **Export Options**: PDF reports in addition to CSV
