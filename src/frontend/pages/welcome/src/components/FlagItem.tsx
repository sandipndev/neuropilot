import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

interface FlagItemProps {
  name: string;
  description: string;
  flagUrl: string;
  enabled: boolean;
}

export const FlagItem: React.FC<FlagItemProps> = ({ 
  name, 
  description, 
  flagUrl, 
  enabled 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(flagUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className={`border-2 transition-colors ${
      enabled 
        ? 'border-chart-4/30 bg-chart-4/5' 
        : 'border-chart-1/30 bg-chart-1/5'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div className="shrink-0 mt-1">
            {enabled ? (
              <CheckCircle2 className="w-6 h-6 text-chart-4" />
            ) : (
              <AlertCircle className="w-6 h-6 text-chart-1" />
            )}
          </div>

          {/* Flag Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">
                  {name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              </div>
              <div className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                enabled 
                  ? 'bg-chart-4/20 text-chart-4' 
                  : 'bg-chart-1/20 text-chart-1'
              }`}>
                {enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {/* Flag URL and Copy Button */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs font-mono break-all">
                  <span className="flex-1 text-muted-foreground">{flagUrl}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy URL
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground italic">
                  Copy this URL and paste it in your browser's address bar to open the flag settings
                </p>
              </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
