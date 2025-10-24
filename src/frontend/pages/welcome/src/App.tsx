import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { IntroductionStep } from "@/components/steps/IntroductionStep";
import { FlagsConfigurationStep } from "@/components/steps/FlagsConfigurationStep";
import { ModelDownloadStep } from "@/components/steps/ModelDownloadStep";
import { UserInfoStep } from "@/components/steps/UserInfoStep";
import { CompletionStep } from "@/components/steps/CompletionStep";
import { useState, useEffect } from "react";
import { getInitialStep } from "@/utils/onboarding-status";

function App() {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const stepLabels = ["Introduction", "Configure Flags", "Download Model", "User Info", "Complete"];

  // Initialize step based on onboarding status
  useEffect(() => {
    const initialStep = getInitialStep();
    setCurrentStep(initialStep);
  }, []);

  const handleContinue = () => {
    setCurrentStep((prev) => (prev !== null ? prev + 1 : 0));
  };

  const handleNavigateToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Show loading state while determining initial step
  if (currentStep === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {currentStep > 0 && currentStep < 4 && (
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={4}
              stepLabels={stepLabels.slice(0, 4)}
              onNavigateToStep={handleNavigateToStep}
            />
          )}

          {currentStep === 0 && <IntroductionStep onContinue={handleContinue} />}
          {currentStep === 1 && <FlagsConfigurationStep onContinue={handleContinue} />}
          {currentStep === 2 && <ModelDownloadStep onContinue={handleContinue} />}
          {currentStep === 3 && <UserInfoStep onComplete={handleContinue} />}
          {currentStep === 4 && <CompletionStep onNavigateToStep={handleNavigateToStep} />}
        </div>
      </div>
    </OnboardingProvider>
  );
}

export default App;
