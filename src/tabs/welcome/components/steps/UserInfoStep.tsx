import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { CheckCircle2, Loader2, User } from 'lucide-react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { setUserName, getUserName, getUserAge } from '../../api/user-data';
import { motion, AnimatePresence } from 'framer-motion';
import { useStorage } from '@plasmohq/storage/hook';

interface UserInfoStepProps {
  onComplete: () => void;
}

export const UserInfoStep: React.FC<UserInfoStepProps> = ({ onComplete }) => {
  const { updateUserData, markStepComplete } = useOnboarding();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Prefill data from localStorage on mount
  useEffect(() => {
    getUserName().then(e => setName(e || ''))
    getUserAge().then(e => setAge(e?.toString() || ''))
  }, []);

  const validateName = (value: string): string => {
    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) {
      return 'Name is required';
    }
    return '';
  };

  const validateAge = (value: string): string => {
    if (!value) {
      return 'Age is required';
    }
    const ageNum = parseInt(value, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return 'Please enter a valid age';
    }
    return '';
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameError) {
      setNameError('');
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAge(value);
    if (ageError) {
      setAgeError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate both fields
    const nameValidationError = validateName(name);
    const ageValidationError = validateAge(age);
    
    if (nameValidationError || ageValidationError) {
      setNameError(nameValidationError);
      setAgeError(ageValidationError);
      return;
    }

    setIsSubmitting(true);
    setNameError('');
    setAgeError('');

    try {
      // Call the mutation
      const result = await setUserName({ 
        name: name.trim(), 
        age: parseInt(age, 10) 
      });

      if (result.success) {
        // Update context
        updateUserData({ name: name.trim() });
        
        // Show success animation
        setIsSuccess(true);

        // Mark step as complete
        markStepComplete(3);

        // Navigate to completion step after animation
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setNameError(result.error || 'Failed to save your information. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setNameError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
      console.error('Error submitting user info:', err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to NeuroPilot</CardTitle>
            </div>
            <CardDescription>
              {isSuccess 
                ? "You're all set! 🎉" 
                : "Let's personalize your experience. Tell us a bit about yourself."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <div className="w-20 h-20 rounded-full bg-chart-4/20 flex items-center justify-center">
                      <CheckCircle2 className="w-12 h-12 text-chart-4" />
                    </div>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-medium text-foreground"
                  >
                    Welcome, {name}! 👋
                  </motion.p>
                </motion.div>
              ) : (
                <form key="form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={handleNameChange}
                      disabled={isSubmitting}
                      aria-invalid={!!nameError}
                      className="text-base"
                      autoFocus
                    />
                    <AnimatePresence>
                      {nameError && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          {nameError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Your Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={age}
                      onChange={handleAgeChange}
                      disabled={isSubmitting}
                      aria-invalid={!!ageError}
                      className="text-base"
                      min="1"
                      max="150"
                    />
                    <AnimatePresence>
                      {ageError && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-destructive flex items-center gap-1"
                        >
                          {ageError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !name.trim() || !age}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Complete Onboarding'
                    )}
                  </Button>
                </form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
