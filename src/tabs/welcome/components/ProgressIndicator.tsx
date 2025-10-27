import { CheckCircle2 } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onNavigateToStep?: (step: number) => void;
}

export function ProgressIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  onNavigateToStep,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full bg-muted rounded-lg p-6">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
          <div
            className="h-full bg-primary transition-all duration-400 ease-in-out"
            style={{
              width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {stepLabels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isClickable = onNavigateToStep && (isCompleted || index <= currentStep);

            return (
              <div 
                key={index} 
                className="flex flex-col items-center"
              >
                {/* Circle or checkmark */}
                <button
                  onClick={() => isClickable && onNavigateToStep(index)}
                  disabled={!isClickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 z-10
                    ${
                      isCompleted
                        ? "bg-chart-4 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border-2 border-border text-muted-foreground"
                    }
                    ${
                      isClickable
                        ? "cursor-pointer hover:scale-110 hover:shadow-lg"
                        : "cursor-default"
                    }
                    disabled:cursor-default disabled:hover:scale-100 disabled:hover:shadow-none
                  `}
                  title={isClickable ? `Go to ${label}` : label}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-sm font-medium text-center max-w-[120px]
                    transition-colors duration-300
                    ${
                      isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
