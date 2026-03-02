import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GoalWithDetails, FrequencyType } from '../types';
import { Calendar, Clock, Repeat } from 'lucide-react';

interface GoalOverviewProps {
  goal: GoalWithDetails;
}

const frequencyLabels: Record<FrequencyType, string> = {
  DAILY: 'Daily',
  WEEKDAYS: 'Weekdays (Mon-Fri)',
  WEEKENDS: 'Weekends (Sat-Sun)',
  CUSTOM: 'Custom Schedule',
};

export const GoalOverview = ({ goal }: GoalOverviewProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        {goal.description && (
          <div>
            <h4 className="text-sm font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          </div>
        )}

        {/* Frequency */}
        {goal.frequency_type && (
          <div className="flex items-start gap-3">
            <Repeat className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium">Frequency</h4>
              <p className="text-sm text-muted-foreground">
                {frequencyLabels[goal.frequency_type]}
              </p>
              {goal.frequency_config?.duration_minutes && (
                <p className="text-xs text-muted-foreground mt-1">
                  {goal.frequency_config.duration_minutes} minutes per session
                </p>
              )}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="space-y-3">
          {goal.start_date && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Start Date</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(goal.start_date)}
                </p>
              </div>
            </div>
          )}

          {goal.target_end_date && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Target End Date</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(goal.target_end_date)}
                </p>
              </div>
            </div>
          )}

          {goal.actual_end_date && (
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Completed On</h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(goal.actual_end_date)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Visibility</span>
            <Badge variant="secondary">
              {goal.is_public ? 'Public' : 'Private'}
            </Badge>
          </div>
          {goal.is_public && (
            <p className="text-xs text-muted-foreground mt-1">
              This goal can be duplicated by other developers
            </p>
          )}
        </div>

        {/* Duplication Info */}
        {goal.duplicated_from && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Duplicated from another goal
            </p>
          </div>
        )}

        {goal.duplication_count > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This goal has been duplicated {goal.duplication_count} time
              {goal.duplication_count !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
