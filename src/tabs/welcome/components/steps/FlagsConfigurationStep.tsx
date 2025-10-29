import { AlertCircle, CheckCircle2, Copy, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { useOnboarding } from "../../contexts/OnboardingContext"
import { checkChromeAIAvailability } from "../../utils/chrome-ai"

interface FlagsConfigurationStepProps {
  onContinue: () => void
}

const FLAGS_CONFIG = [
  {
    key: "promptApi" as const,
    name: "Prompt API for Gemini Nano",
    description: "Enables the core Chrome AI language model API",
    flagUrl: "chrome://flags/#prompt-api-for-gemini-nano"
  },
  {
    key: "multimodalInput" as const,
    name: "Prompt API for Gemini Nano - Multimodal Input Support",
    description: "Enables multimodal capabilities for the AI model",
    flagUrl: "chrome://flags/#prompt-api-for-gemini-nano-multimodal-input"
  },
  {
    key: "optimizationGuide" as const,
    name: "Optimization Guide On-Device Model",
    description: "Enables on-device model optimization",
    flagUrl: "chrome://flags/#optimization-guide-on-device-model"
  },
  {
    key: "writerApi" as const,
    name: "Writer API for Gemini Nano",
    description: "Enables AI-powered content writing capabilities",
    flagUrl: "chrome://flags/#writer-api-for-gemini-nano"
  },
  {
    key: "rewriterApi" as const,
    name: "Rewriter API for Gemini Nano",
    description: "Enables AI-powered content rewriting capabilities",
    flagUrl: "chrome://flags/#rewriter-api-for-gemini-nano"
  },
  {
    key: "proofreaderApi" as const,
    name: "Proofreader API for Gemini Nano",
    description: "Enables AI-powered proofreading capabilities",
    flagUrl: "chrome://flags/#proofreader-api-for-gemini-nano"
  },
  {
    key: "translationApi" as const,
    name: "On Device Language Translation API",
    description:
      "Enables AI powered on-device language translation capabilities",
    flagUrl: "chrome://flags/#translation-api"
  }
]

export const FlagsConfigurationStep: React.FC<FlagsConfigurationStepProps> = ({
  onContinue
}) => {
  const { state, updateFlagsStatus } = useOnboarding()
  const [isChecking, setIsChecking] = useState(false)

  // Check flags status on mount
  useEffect(() => {
    checkFlagsStatus()
  }, [])

  const checkFlagsStatus = async () => {
    setIsChecking(true)

    try {
      // Check if LanguageModel.availability exists - this indicates flags are properly set
      const aiCheck = await checkChromeAIAvailability()

      if (aiCheck.available) {
        // If LanguageModel.availability exists, all required flags are enabled
        updateFlagsStatus({
          promptApi: true,
          multimodalInput: true,
          optimizationGuide: true,
          writerApi: true,
          rewriterApi: true,
          proofreaderApi: true,
          translationApi: true
        })
      } else {
        // If not available, one or more flags are not enabled
        // Note: We can't check individual flags, so we mark all as disabled
        updateFlagsStatus({
          promptApi: false,
          multimodalInput: false,
          optimizationGuide: false,
          writerApi: false,
          rewriterApi: false,
          proofreaderApi: false,
          translationApi: false
        })
      }
    } catch (error) {
      console.error("Error checking flags:", error)
      // On error, assume flags are not enabled
      updateFlagsStatus({
        promptApi: false,
        multimodalInput: false,
        optimizationGuide: false,
        writerApi: false,
        rewriterApi: false,
        proofreaderApi: false,
        translationApi: false
      })
    } finally {
      setIsChecking(false)
    }
  }

  const aiFlagsEnabled =
    state.flagsStatus.promptApi &&
    state.flagsStatus.multimodalInput &&
    state.flagsStatus.optimizationGuide &&
    state.flagsStatus.writerApi &&
    state.flagsStatus.rewriterApi &&
    state.flagsStatus.proofreaderApi &&
    state.flagsStatus.translationApi

  const handleContinue = () => {
    if (aiFlagsEnabled) {
      onContinue()
    }
  }

  const SimpleFlagItem = ({
    name,
    flagUrl
  }: {
    name: string
    flagUrl: string
  }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(flagUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }

    return (
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-foreground font-medium flex-1">{name}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs shrink-0">
          {copied ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy URL
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in-up">
      {/* Header with Status */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          Enable Chrome AI Flags
        </h2>

        {/* Overall Status Badge */}
        <div className="flex items-center justify-center gap-2">
          {aiFlagsEnabled ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-chart-4/10 border border-chart-4/30 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-chart-4" />
              <span className="text-sm font-semibold text-chart-4">
                AI Flags Enabled
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted border rounded-full">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">
                Flags Not Enabled
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={checkFlagsStatus}
            disabled={isChecking}
            className="gap-2 h-9">
            <RefreshCw
              className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`}
            />
            {isChecking ? "Checking..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left Column: Instructions */}
        <Card className="border-chart-4/20 bg-chart-4/5 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">
              Quick Setup Guide
            </h3>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">1.</span>
                <p>
                  Click "Copy URL" for each flag and paste it in your browser's
                  address bar
                </p>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">2.</span>
                <p>Set each flag's dropdown to "Enabled"</p>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">3.</span>
                <p>After enabling all flags, click the "Relaunch" button</p>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 font-bold text-primary">4.</span>
                <p>Return here and click "Refresh" to verify</p>
              </div>
            </div>
            <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Keep this tab open
              while enabling flags
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Flags List */}
        <Card className="border-chart-4/20 backdrop-blur-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">
              Required Flags ({FLAGS_CONFIG.length})
            </h3>
            <div className="space-y-2.5">
              {FLAGS_CONFIG.map((flag) => (
                <SimpleFlagItem
                  key={flag.key}
                  name={flag.name}
                  flagUrl={flag.flagUrl}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!aiFlagsEnabled}
          className="px-8">
          {aiFlagsEnabled
            ? "Continue to Model Download"
            : "Enable Flags to Continue"}
        </Button>
      </div>
    </div>
  )
}
