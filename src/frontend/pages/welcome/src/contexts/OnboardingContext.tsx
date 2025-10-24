import React, { createContext, useContext, useState, type ReactNode } from 'react';

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

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    stepsCompleted: [false, false, false, false],
    flagsStatus: {
      promptApi: false,
      multimodalInput: false,
      optimizationGuide: false,
    },
    modelDownloadProgress: 0,
    modelAvailable: false,
    userData: {
      name: '',
    },
  });

  const goToStep = (step: number) => {
    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  };

  const markStepComplete = (step: number) => {
    setState((prev) => {
      const newStepsCompleted = [...prev.stepsCompleted];
      newStepsCompleted[step] = true;
      return {
        ...prev,
        stepsCompleted: newStepsCompleted,
      };
    });
  };

  const updateFlagsStatus = (flags: Partial<OnboardingState['flagsStatus']>) => {
    setState((prev) => ({
      ...prev,
      flagsStatus: {
        ...prev.flagsStatus,
        ...flags,
      },
    }));
  };

  const updateModelProgress = (progress: number) => {
    setState((prev) => ({
      ...prev,
      modelDownloadProgress: progress,
    }));
  };

  const setModelAvailable = (available: boolean) => {
    setState((prev) => ({
      ...prev,
      modelAvailable: available,
    }));
  };

  const updateUserData = (data: Partial<OnboardingState['userData']>) => {
    setState((prev) => ({
      ...prev,
      userData: {
        ...prev.userData,
        ...data,
      },
    }));
  };

  const value: OnboardingContextType = {
    state,
    goToStep,
    markStepComplete,
    updateFlagsStatus,
    updateModelProgress,
    setModelAvailable,
    updateUserData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
