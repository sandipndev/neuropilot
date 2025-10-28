import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { checkModelAvailability } from "../../utils/chrome-ai";

interface ModelDownloadStepProps {
  onContinue: () => void;
}

type DownloadStatus = 'idle' | 'checking' | 'downloading' | 'complete' | 'error';

export const ModelDownloadStep: React.FC<ModelDownloadStepProps> = ({ 
  onContinue 
}) => {
  const { state, updateModelProgress, setModelAvailable } = useOnboarding();
  const [status, setStatus] = useState<DownloadStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [needsDownload, setNeedsDownload] = useState(false);

  // Check model availability on mount
  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    setStatus('checking');
    setErrorMessage('');
    
    try {
      const modelCheck = await checkModelAvailability();
      
      if (modelCheck.available) {
        // Model is already available
        setModelAvailable(true);
        updateModelProgress(100);
        setStatus('complete');
        setNeedsDownload(false);
      } else if (modelCheck.needsDownload) {
        // Model needs to be downloaded
        setModelAvailable(false);
        updateModelProgress(0);
        setStatus('idle');
        setNeedsDownload(true);
      } else {
        // Model is not available on this device
        setStatus('error');
        setErrorMessage(modelCheck.message);
        setNeedsDownload(false);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : 'Failed to check model availability'
      );
    }
  };

  const downloadModel = async () => {
    setStatus('downloading');
    setErrorMessage('');
    updateModelProgress(0);

    try {
      const LanguageModel = (window as any).LanguageModel;
      
      // Create a language model session with download progress monitoring
      const session = await LanguageModel.create({
        monitor(m: any) {
          m.addEventListener('downloadprogress', (e: any) => {
            const progress = (e.loaded / e.total) * 100;
            updateModelProgress(progress);
          });
        },
      });

      // 

      // Download complete
      setModelAvailable(true);
      updateModelProgress(100);
      setStatus('complete');
      
      // Clean up the session
      session.destroy();
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error 
          ? `Download failed: ${error.message}` 
          : 'Failed to download the model. Please try again.'
      );
      updateModelProgress(0);
    }
  };

  const handleRetry = () => {
    if (needsDownload) {
      downloadModel();
    } else {
      checkModelStatus();
    }
  };

  const handleContinue = () => {
    if (status === 'complete') {
      onContinue();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Download AI Model
        </h2>
        <p className="text-muted-foreground">
          NeuroPilot uses Google's Gemini Nano model for on-device AI processing
        </p>
      </div>

      {/* Model Status Card */}
      <Card className="backdrop-blur-sm bg-card/80">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Gemini Nano Model
                {status === 'complete' && (
                  <Badge variant="default" className="bg-chart-4 text-white">
                    Ready
                  </Badge>
                )}
                {status === 'idle' && needsDownload && (
                  <Badge variant="secondary">
                    Needs Download
                  </Badge>
                )}
                {status === 'checking' && (
                  <Badge variant="secondary">
                    Checking...
                  </Badge>
                )}
                {status === 'downloading' && (
                  <Badge variant="default" className="bg-chart-4 text-white">
                    Downloading
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {status === 'complete' && 'Model is installed and ready to use'}
                {status === 'idle' && needsDownload && 'Click below to download the model (~1-2GB)'}
                {status === 'checking' && 'Checking model availability...'}
                {status === 'downloading' && 'Downloading model, please wait...'}
                {status === 'error' && 'There was an issue with the model'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Checking State */}
          {status === 'checking' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Idle State - Ready to Download */}
          {status === 'idle' && needsDownload && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm text-foreground font-medium">
                  What you need to know:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Download size: approximately 1-2GB</li>
                  <li>Requires stable internet connection</li>
                  <li>Download happens once, model stays on your device</li>
                  <li>All processing happens locally - no data sent to servers</li>
                </ul>
              </div>

              <Button
                size="lg"
                onClick={downloadModel}
                className="w-full text-lg py-6"
              >
                <Download className="w-5 h-5" />
                Start Download
              </Button>
            </div>
          )}

          {/* Downloading State */}
          {status === 'downloading' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Download Progress</span>
                  <span className="font-medium text-foreground">
                    {Math.round(state.modelDownloadProgress)}%
                  </span>
                </div>
                <Progress value={state.modelDownloadProgress} className="h-3" />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This may take a few minutes depending on your internet speed. 
                  Please keep this tab open until the download completes.
                </p>
              </div>
            </div>
          )}

          {/* Complete State */}
          {status === 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-chart-4/10 border border-chart-4/30 rounded-lg">
                <CheckCircle2 className="w-8 h-8 text-chart-4 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">
                    Model downloaded successfully!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your AI model is ready for on-device processing
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ✨ The model will now run entirely on your device, ensuring your privacy 
                  and enabling fast, offline AI capabilities.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Download Failed</AlertTitle>
                <AlertDescription>
                  {errorMessage || 'An unexpected error occurred while downloading the model.'}
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm text-foreground font-medium">
                  Troubleshooting tips:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Check your internet connection</li>
                  <li>Ensure you have at least 2GB of free disk space</li>
                  <li>Try closing other tabs to free up memory</li>
                  <li>Make sure Chrome flags are properly enabled</li>
                  <li>Restart Chrome and try again</li>
                </ul>
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={handleRetry}
                className="w-full"
              >
                <AlertCircle className="w-5 h-5" />
                Retry Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Continue Button */}
      {status === 'complete' && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={handleContinue}
            className="text-lg px-8 py-6"
          >
            Continue to User Setup
          </Button>
        </div>
      )}
    </div>
  );
};
