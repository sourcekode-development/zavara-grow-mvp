import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import { format } from 'date-fns';
import { AssessmentForm, type AssessmentFormData } from './assessment-form';
import type { Checkpoint, CheckpointStatus } from '../types';

interface CheckpointReviewFormProps {
  checkpoint: Checkpoint;
  onSubmit: (passed: boolean, assessmentData: AssessmentFormData) => void;
  isLoading?: boolean;
}

export const CheckpointReviewForm = ({
  checkpoint,
  onSubmit,
  isLoading = false,
}: CheckpointReviewFormProps) => {
  const [reviewDecision, setReviewDecision] = useState<'pass' | 'fail' | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentFormData>({
    feedback: '',
    action_items: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewDecision && assessmentData.feedback.trim()) {
      onSubmit(reviewDecision === 'pass', assessmentData);
    }
  };

  const canSubmit = reviewDecision !== null && assessmentData.feedback.trim().length > 0;

  const statusConfig: Record<CheckpointStatus, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending Review',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    READY_FOR_REVIEW: {
      label: 'Ready for Review',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    REVIEW_IN_PROGRESS: {
      label: 'Review in Progress',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    NEEDS_ATTENTION: {
      label: 'Needs Attention',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
    PASSED: {
      label: 'Passed',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
    FAILED: {
      label: 'Failed',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
    SKIPPED: {
      label: 'Skipped',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };

  const config = statusConfig[checkpoint.status];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Checkpoint Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#3DCF8E]" />
                Checkpoint Details
              </CardTitle>
            </div>
            <Badge className={`${config.color} flex items-center gap-1`}>
              {config.icon}
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="font-medium">{checkpoint.goal?.title || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Milestone</p>
            <p className="font-medium">{checkpoint.milestone?.title || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {checkpoint.scheduled_date && (
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Date</p>
                <p className="font-medium">
                  {format(new Date(checkpoint.scheduled_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            {checkpoint.review_started_at && (
              <div>
                <p className="text-sm text-muted-foreground">Review Started</p>
                <p className="font-medium">
                  {format(new Date(checkpoint.review_started_at), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
          </div>
          {checkpoint.developer_notes && (
            <div>
              <p className="text-sm text-muted-foreground">Developer Notes</p>
              <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                {checkpoint.developer_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Decision */}
      <Card>
        <CardHeader>
          <CardTitle>Review Decision</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-3 block">
            Pass or Fail? <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={reviewDecision || ''}
            onValueChange={(value: string) => setReviewDecision(value as 'pass' | 'fail')}
            className="space-y-3"
          >
            <div
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reviewDecision === 'pass'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setReviewDecision('pass')}
            >
              <input
                type="radio"
                value="pass"
                checked={reviewDecision === 'pass'}
                onChange={() => setReviewDecision('pass')}
                className="h-4 w-4 text-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Label className="font-semibold cursor-pointer">Pass</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  The developer has met the checkpoint requirements
                </p>
              </div>
            </div>

            <div
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                reviewDecision === 'fail'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => setReviewDecision('fail')}
            >
              <input
                type="radio"
                value="fail"
                checked={reviewDecision === 'fail'}
                onChange={() => setReviewDecision('fail')}
                className="h-4 w-4 text-red-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Label className="font-semibold cursor-pointer">Fail</Label>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  The developer needs to address issues before passing
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Assessment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment & Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <AssessmentForm
            initialData={assessmentData}
            onChange={setAssessmentData}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!canSubmit || isLoading} className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90">
          {isLoading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
};
