import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Flag, Download, User, Sparkles } from 'lucide-react';
import { getUserName, getUserAge } from '../../../../../../api/mutations/set-user-name';

interface CompletionStepProps {
  onNavigateToStep: (step: number) => void;
}

const STEPS_INFO = [
  {
    id: 0,
    icon: Sparkles,
    label: 'Introduction',
    description: 'Learn about NeuroPilot',
  },
  {
    id: 1,
    icon: Flag,
    label: 'Configure Flags',
    description: 'Enable Chrome AI features',
  },
  {
    id: 2,
    icon: Download,
    label: 'Download Model',
    description: 'Get the AI model',
  },
  {
    id: 3,
    icon: User,
    label: 'User Info',
    description: 'Personalize your experience',
  },
];

export const CompletionStep: React.FC<CompletionStepProps> = ({ onNavigateToStep }) => {
  const userName = getUserName();
  const userAge = getUserAge();

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl space-y-6"
      >
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-chart-4/20 flex items-center justify-center">
              <CheckCircle2 className="w-16 h-16 text-chart-4" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-foreground">
              🎉 Onboarding Complete!
            </h2>
            <p className="text-xl text-muted-foreground">
              Welcome to NeuroPilot, <span className="font-semibold text-foreground">{userName}</span>!
            </p>
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>You're All Set!</CardTitle>
              <CardDescription>
                Feel free to close this tab and open the extension whenever you need more information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground">Your Profile</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Name: <span className="font-medium text-foreground">{userName}</span></span>
                  <span>•</span>
                  <span>Age: <span className="font-medium text-foreground">{userAge}</span></span>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Want to review any step?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {STEPS_INFO.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <Button
                          variant="outline"
                          className="w-full h-auto py-3 px-4 flex flex-col items-start gap-2 hover:bg-accent"
                          onClick={() => onNavigateToStep(step.id)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{step.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground text-left">
                            {step.description}
                          </span>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Next Steps */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What's Next?
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Start browsing and let NeuroPilot track your attention</li>
                  <li>Build deep knowledge through focused engagement</li>
                  <li>Take AI-powered quizzes to reinforce your learning</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            You can close this tab anytime. The extension is ready to use! 🚀
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
