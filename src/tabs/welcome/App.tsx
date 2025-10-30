import { useEffect, useState } from "react"

import { ProgressIndicator } from "./components/ProgressIndicator"
import { CompletionStep } from "./components/steps/CompletionStep"
import { FlagsConfigurationStep } from "./components/steps/FlagsConfigurationStep"
import { IntroductionStep } from "./components/steps/IntroductionStep"
import { ModelDownloadStep } from "./components/steps/ModelDownloadStep"
import { UserInfoStep } from "./components/steps/UserInfoStep"
import { OnboardingProvider } from "./contexts/OnboardingContext"

import "./index.css"
import { useStorage } from "@plasmohq/storage/hook"
import { INTRO_STEP_SHOWN_KEY, USER_NAME_KEY } from "./api/user-data"

function App() {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [userNamex] = useStorage(USER_NAME_KEY);
  const [introStepShownx] = useStorage(INTRO_STEP_SHOWN_KEY);

  const getStatus = (_introStepShown: boolean, _userName: string) => {
    const isComplete = !!_userName;

    if(isComplete){
      return 4
    }

    if(_introStepShown){
      return 1;
    }

    return 0;
  }

  useEffect(() => {
    setCurrentStep(getStatus(introStepShownx, userNamex))
  }, [userNamex, introStepShownx])

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

  console.log(currentStep)
  if(currentStep === -1) return null;

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
