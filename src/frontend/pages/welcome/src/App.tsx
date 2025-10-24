import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ProgressIndicator } from "@/components/ProgressIndicator";
import { IntroductionStep } from "@/components/steps/IntroductionStep";
import { useState } from "react";

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const stepLabels = ["Introduction", "Configure Flags", "Download Model", "User Info"];

  const handleContinue = () => {
    setCurrentStep(1);
  };

  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {currentStep > 0 && (
            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={stepLabels.length}
              stepLabels={stepLabels}
            />
          )}
          
          {currentStep === 0 && <IntroductionStep onContinue={handleContinue} />}
          
          {currentStep > 0 && (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                Step {currentStep + 1} component will be implemented next
              </p>
            </div>
          )}
        </div>
      </div>
    </OnboardingProvider>
  );
}

export default App;
