'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Target, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingData } from '@/lib/auth';

const onboardingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  companyUrl: z.string().url().optional().or(z.literal('')),
  solution: z.string().min(10, 'Please describe your solution (at least 10 characters)'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete?: (data: OnboardingFormData) => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { saveOnboardingData } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      setIsSubmitting(true);
      
      // Save onboarding data using the hook
      await saveOnboardingData(data);
      
      // Call the optional onComplete callback if provided
      if (onComplete) {
        onComplete(data);
      }
      
      reset();
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      // Error is already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Welcome to Your AI Assistant!
          </DialogTitle>
          <DialogDescription>
            Let's personalize your experience by learning about your business.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name *
              </Label>
              <Input
                id="companyName"
                placeholder="Enter your company name"
                {...register('companyName')}
              />
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyUrl">Company Website (Optional)</Label>
              <Input
                id="companyUrl"
                type="url"
                placeholder="https://yourcompany.com"
                {...register('companyUrl')}
              />
              {errors.companyUrl && (
                <p className="text-sm text-red-600">{errors.companyUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                What solution are you selling? *
              </Label>
              <Textarea
                id="solution"
                placeholder="Describe your product or service in detail. This helps our AI provide more relevant suggestions..."
                rows={4}
                {...register('solution')}
              />
              {errors.solution && (
                <p className="text-sm text-red-600">{errors.solution.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Saving...' : 'Get Started'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
