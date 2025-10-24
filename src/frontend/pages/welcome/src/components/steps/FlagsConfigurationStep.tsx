import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCw, ChevronDown, Info } from "lucide-react";
import { FlagItem } from "@/components/FlagItem";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { checkChromeAIAvailability } from "@/utils/chrome-ai";

interface FlagsConfigurationStepProps {
  onContinue: () => void;
}

const FLAGS_CONFIG = [
  {
    key: 'promptApi' as const,
    name: 'Prompt API for Gemini Nano',
    description: 'Enables the core Chrome AI language model API',
    flagUrl: 'chrome://flags/#prompt-api-for-gemini-nano',
  },
  {
    key: 'multimodalInput' as const,
    name: 'Multimodal Input Support',
    description: 'Enables multimodal capabilities for the AI model',
    flagUrl: 'chrome://flags/#prompt-api-for-gemini-nano-multimodal-input',
  },
  {
    key: 'optimizationGuide' as const,
    name: 'Optimization Guide On-Device Model',
    description: 'Enables on-device model optimization',
    flagUrl: 'chrome://flags/#optimization-guide-on-device-model',
  },
];

export const FlagsConfigurationStep: React.FC<FlagsConfigurationStepProps> = ({ 
  onContinue 
}) => {
  const { state, updateFlagsStatus } = useOnboarding();
  const [isChecking, setIsChecking] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // Check flags status on mount
  useEffect(() => {
    checkFlagsStatus();
  }, []);

  const checkFlagsStatus = async () => {
    setIsChecking(true);
    
    try {
      // Check if LanguageModel.availability exists - this indicates flags are properly set
      const aiCheck = await checkChromeAIAvailability();
      
      if (aiCheck.available) {
        // If LanguageModel.availability exists, all required flags are enabled
        updateFlagsStatus({
          promptApi: true,
          multimodalInput: true,
          optimizationGuide: true,
        });
      } else {
        // If not available, one or more flags are not enabled
        // Note: We can't check individual flags, so we mark all as disabled
        updateFlagsStatus({
          promptApi: false,
          multimodalInput: false,
          optimizationGuide: false,
        });
      }
    } catch (error) {
      console.error('Error checking flags:', error);
      // On error, assume flags are not enabled
      updateFlagsStatus({
        promptApi: false,
        multimodalInput: false,
        optimizationGuide: false,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const allFlagsEnabled = 
    state.flagsStatus.promptApi && 
    state.flagsStatus.multimodalInput && 
    state.flagsStatus.optimizationGuide;

  const handleContinue = () => {
    if (allFlagsEnabled) {
      onContinue();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Enable Chrome AI Flags
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          To use NeuroPilot's on-device AI features, you need to enable three Chrome flags. 
          Don't worry, we'll guide you through it!
        </p>
      </div>

      {/* What are Chrome Flags Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5" />
            What are Chrome Flags?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chrome flags are experimental features that aren't enabled by default. 
            They allow you to test cutting-edge capabilities like on-device AI. 
            Enabling these flags is safe and can be reversed at any time.
          </p>
        </CardContent>
      </Card>

      {/* Flags Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Required Flags
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkFlagsStatus}
            disabled={isChecking}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </Button>
        </div>

        <div className="space-y-3">
          {FLAGS_CONFIG.map((flag) => (
            <FlagItem
              key={flag.key}
              name={flag.name}
              description={flag.description}
              flagUrl={flag.flagUrl}
              enabled={state.flagsStatus[flag.key]}
            />
          ))}
        </div>
      </div>

      {/* Instructions Panel */}
      {!allFlagsEnabled && (
        <Collapsible
          open={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
        >
          <Card className="border-chart-1/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    How to Enable Flags
                  </CardTitle>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform ${
                      isInstructionsOpen ? 'rotate-180' : ''
                    }`} 
                  />
                </div>
                <CardDescription>
                  Click to view step-by-step instructions
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-0">
                <div className="p-3 bg-chart-1/10 border border-chart-1/30 rounded-md mb-4">
                  <p className="text-xs text-muted-foreground">
                    ⚠️ <span className="font-medium">Note:</span> Chrome doesn't allow extensions to open chrome:// URLs programmatically for security reasons. You'll need to manually copy and paste the URLs into your address bar.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Copy the flag URL from each disabled flag above
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click "Copy URL" button and paste it into your browser's address bar
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Change the dropdown to "Enabled"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Look for the dropdown menu next to the flag name and select "Enabled"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Repeat for all three flags
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enable all three flags before restarting Chrome to save time
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Restart Chrome when prompted
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        After enabling all flags, Chrome will show a "Relaunch" button. Click it to apply changes
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      5
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Return here and click "Refresh Status"
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        After Chrome restarts, come back to this page and refresh to verify the flags are enabled
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    💡 <span className="font-medium">Tip:</span> Keep this tab open while you enable the flags so you can easily return here after restarting
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Success Message */}
      {allFlagsEnabled && (
        <Card className="border-chart-4/30 bg-chart-4/5 animate-fade-in-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-chart-4 flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  All flags are enabled!
                </p>
                <p className="text-sm text-muted-foreground">
                  You're ready to proceed to the next step
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!allFlagsEnabled}
          className="text-lg px-8 py-6"
        >
          Continue to Model Download
        </Button>
      </div>
    </div>
  );
};
