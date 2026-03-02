import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Checkpoint, CheckpointStatus } from '../types';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  onMarkReady?: (checkpointId: string) => void;
  onViewAssessment?: (checkpointId: string) => void;
  onEdit?: (checkpoint: Checkpoint) => void;
  onDelete?: (checkpointId: string) => void;
  isOwner?: boolean;
  isReviewer?: boolean;
  canEdit?: boolean;
  isLoading?: boolean;
}

export const CheckpointCard = ({
  checkpoint,
  onMarkReady,
  onViewAssessment,
  onEdit,
  onDelete,
  isOwner = false,
  canEdit = false,
  isLoading = false,
}: CheckpointCardProps) => {
  const statusConfig: Record<
    CheckpointStatus,
    { label: string; color: string; icon: React.ReactNode; description: string }
  > = {
    PENDING: {
      label: 'Pending',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      icon: <Clock className="h-3.5 w-3.5" />,
      description: 'Not yet ready for review',
    },
    READY_FOR_REVIEW: {
      label: 'Ready for Review',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <Target className="h-3.5 w-3.5" />,
      description: 'Awaiting reviewer action',
    },
    REVIEW_IN_PROGRESS: {
      label: 'Review in Progress',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      icon: <Clock className="h-3.5 w-3.5" />,
      description: 'Currently being reviewed',
    },
    NEEDS_ATTENTION: {
      label: 'Needs Attention',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      description: 'Requires developer action',
    },
    PASSED: {
      label: 'Passed',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      description: 'Successfully completed',
    },
    FAILED: {
      label: 'Failed',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      icon: <XCircle className="h-3.5 w-3.5" />,
      description: 'Did not meet requirements',
    },
    SKIPPED: {
      label: 'Skipped',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      icon: <Clock className="h-3.5 w-3.5" />,
      description: 'Not completed',
    },
  };

  const getTriggerDescription = (checkpoint: Checkpoint) => {
    if (checkpoint.trigger_type === 'AFTER_DAYS' && checkpoint.trigger_config?.after_days) {
      return `Triggers after ${checkpoint.trigger_config.after_days} days from goal start`;
    }
    if (checkpoint.trigger_type === 'AFTER_MILESTONE' && checkpoint.milestone) {
      return `Triggers after milestone: ${checkpoint.milestone.title}`;
    }
    return 'Manual trigger';
  };

  const config = statusConfig[checkpoint.status];

  const showMarkReady = isOwner && checkpoint.status === 'PENDING' && onMarkReady;
  const showViewAssessment =
    (checkpoint.status === 'PASSED' || checkpoint.status === 'FAILED' || checkpoint.status === 'NEEDS_ATTENTION') &&
    onViewAssessment;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {checkpoint.title}
              <Badge className={`${config.color} flex items-center gap-1`}>
                {config.icon}
                {config.label}
              </Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {checkpoint.description && <p className="text-sm text-muted-foreground">{checkpoint.description}</p>}

        {/* Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {/* Type */}
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" />
            <span>{checkpoint.type === 'AI_INTERVIEW' ? 'AI Interview' : 'Manual Review'}</span>
          </div>

          {/* Scheduled Date */}
          {checkpoint.scheduled_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(checkpoint.scheduled_date), 'MMM dd, yyyy')}</span>
            </div>
          )}

          {/* Trigger */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{getTriggerDescription(checkpoint)}</span>
          </div>
        </div>

        {/* Goal Info (if checkpoint is from goals list) */}
        {checkpoint.goal && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Goal</p>
            <p className="text-sm font-medium">{checkpoint.goal.title}</p>
          </div>
        )}

        {/* Developer Notes */}
        {checkpoint.developer_notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Developer Notes</p>
            <p className="text-sm">{checkpoint.developer_notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {showMarkReady && (
            <Button
              size="sm"
              onClick={() => onMarkReady(checkpoint.id)}
              disabled={isLoading}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Ready for Review
            </Button>
          )}

          {showViewAssessment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewAssessment(checkpoint.id)}
              disabled={isLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Assessment
            </Button>
          )}

          {/* Edit/Delete for pending checkpoints */}
          {canEdit && checkpoint.status === 'PENDING' && (
            <>
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(checkpoint)} disabled={isLoading}>
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(checkpoint.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
