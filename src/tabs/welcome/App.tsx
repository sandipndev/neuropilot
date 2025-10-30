import { useState } from "react"

import { ProgressIndicator } from "./components/ProgressIndicator"
import { CompletionStep } from "./components/steps/CompletionStep"
import { FlagsConfigurationStep } from "./components/steps/FlagsConfigurationStep"
import { IntroductionStep } from "./components/steps/IntroductionStep"
import { ModelDownloadStep } from "./components/steps/ModelDownloadStep"
import { UserInfoStep } from "./components/steps/UserInfoStep"
import { OnboardingProvider } from "./contexts/OnboardingContext"
import { useGetInitialStep } from "./utils/onboarding-status"

import "./index.css"

function App() {
  const initialStep = useGetInitialStep()
  const [currentStep, setCurrentStep] = useState<number>(initialStep)
  const stepLabels = [
    "Introduction",
    "Configure Flags",
    "Download Model",
    "User Info",
    "Complete"
  ]

  const handleContinue = () => {
    setCurrentStep((prev) => (prev !== null ? prev + 1 : 0))
  }

  const handleNavigateToStep = (step: number) => {
    setCurrentStep(step)
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

          {currentStep === 0 && (
            <IntroductionStep onContinue={handleContinue} />
          )}
          {currentStep === 1 && (
            <FlagsConfigurationStep onContinue={handleContinue} />
          )}
          {currentStep === 2 && (
            <ModelDownloadStep onContinue={handleContinue} />
          )}
          {currentStep === 3 && <UserInfoStep onComplete={handleContinue} />}
          {currentStep === 4 && (
            <CompletionStep onNavigateToStep={handleNavigateToStep} />
          )}
        </div>
      </div>
    </OnboardingProvider>
  )
}

export default App
