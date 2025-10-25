import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FocusStateSection } from './components/FocusStateSection';
import { StatsSection } from './components/StatsSection';
import { QuizSection } from './components/QuizSection';
import { PulseSection } from './components/PulseSection';
import { ChatSection } from './components/ChatSection';
import { getUserName } from 'neuropilot-api';
import { useFocusData } from './hooks/useFocusData';
import { useWinsData } from './hooks/useWinsData';
import { useQuizQuestions } from './hooks/useQuizQuestions';
import { usePulseData } from './hooks/usePulseData';

function App() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch focus data
  const { currentFocus, focusHistory, isLoading: focusLoading } = useFocusData();
  
  // Fetch wins data
  const { wins, isLoading: winsLoading } = useWinsData();
  
  // Fetch quiz questions
  const { 
    questions, 
    unansweredQuestions, 
    isLoading: quizLoading, 
    markAsAnswered 
  } = useQuizQuestions();
  
  // Fetch pulse data
  const { pulses, isLoading: pulseLoading } = usePulseData();

  // Load user name on mount
  useEffect(() => {
    const name = getUserName();
    setUserName(name);
  }, []);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('pinnacle:theme');
    const prefersDark = savedTheme === 'dark' || 
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(prefersDark);
    
    // Apply theme to document
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSettingsClick = () => {
    // Placeholder for settings modal
    console.log('Settings clicked');
    // TODO: Implement settings modal
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    // Save to localStorage
    localStorage.setItem('pinnacle:theme', newTheme ? 'dark' : 'light');
    
    // Apply to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        userName={userName}
        onSettingsClick={handleSettingsClick}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />
      
      {/* Main content */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Focus State Section */}
          <div className="lg:col-span-1">
            <FocusStateSection
              currentFocus={currentFocus}
              focusHistory={focusHistory}
              isLoading={focusLoading}
            />
          </div>

          {/* Statistics Section */}
          <div className="lg:col-span-2">
            <StatsSection
              focusHistory={focusHistory}
              wins={wins}
              isLoading={focusLoading || winsLoading}
            />
          </div>

          {/* Quiz Section */}
          <div className="lg:col-span-1">
            <QuizSection
              questions={questions}
              unansweredQuestions={unansweredQuestions}
              isLoading={quizLoading}
              onAnswerSubmit={markAsAnswered}
            />
          </div>

          {/* Pulse Section */}
          <div className="lg:col-span-2">
            <PulseSection
              pulses={pulses}
              isLoading={pulseLoading}
            />
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-3">
            <ChatSection
              currentFocus={currentFocus}
              focusHistory={focusHistory}
            />
          </div>

          {/* Other sections will be added in future tasks */}
        </div>
      </main>
    </div>
  );
}

export default App;
