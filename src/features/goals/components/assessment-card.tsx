import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Award, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ActionItemsList } from './action-items-list';
import type { Assessment } from '../types';

interface AssessmentCardProps {
  assessment: Assessment;
  showActionItems?: boolean;
}

export const AssessmentCard = ({ assessment, showActionItems = true }: AssessmentCardProps) => {
  const isPassed = assessment.passed;

  return (
    <Card className="overflow-hidden">
      {/* Header with Pass/Fail Status */}
      <div
        className={`p-6 ${
          isPassed
            ? 'bg-green-50 dark:bg-green-900/10 border-b border-green-200 dark:border-green-900'
            : 'bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full ${
              isPassed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}
          >
            {isPassed ? (
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold">
              {isPassed ? 'Checkpoint Passed' : 'Needs Improvement'}
            </h3>
            {assessment.score !== null && (
              <div className="flex items-center gap-2 mt-1">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  Score: {assessment.score}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Overall Feedback */}
        {assessment.feedback_text && (
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Overall Feedback</h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{assessment.feedback_text}</p>
          </div>
        )}

        {/* Strengths */}
        {assessment.strengths && (
          <div>
            <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Key Strengths
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{assessment.strengths}</p>
          </div>
        )}

        {/* Areas for Improvement */}
        {assessment.areas_for_improvement && (
          <div>
            <h4 className="font-semibold text-sm text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Areas for Improvement
            </h4>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {assessment.areas_for_improvement}
            </p>
          </div>
        )}

        {/* Action Items */}
        {showActionItems && assessment.action_items && assessment.action_items.length > 0 && (
          <ActionItemsList actionItems={assessment.action_items} />
        )}

        {/* Review Metadata */}
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {assessment.reviewer_id && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Reviewed by Team Lead</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(assessment.reviewed_at), 'MMM dd, yyyy')}</span>
            </div>
            {assessment.review_duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{assessment.review_duration_minutes} min review</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
