import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router';
import { GoalStatusBadge } from './goal-status-badge';
import { StreakBadge } from './streak-badge';
import type { GoalWithDetails } from '../types';
import { Calendar, Target, CheckSquare } from 'lucide-react';

interface GoalCardProps {
  goal: GoalWithDetails;
}

export const GoalCard = ({ goal }: GoalCardProps) => {
  const navigate = useNavigate();
  
  const progressPercentage = goal.total_sessions > 0
    ? Math.round((goal.completed_sessions / goal.total_sessions) * 100)
    : 0;

  const canEdit = goal.status === 'DRAFT' || goal.status === 'CHANGES_REQUESTED';
  const canStart = goal.status === 'APPROVED';
  const isActive = goal.status === 'IN_PROGRESS';
  
  const checkpointCount = goal.checkpoints?.length || 0;
  const pendingCheckpoints = goal.checkpoints?.filter(cp => 
    cp.status === 'PENDING' || cp.status === 'READY_FOR_REVIEW'
  ).length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3" onClick={() => navigate(`/goals/${goal.id}`)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg group-hover:text-[#3DCF8E] transition-colors">
              {goal.title}
            </CardTitle>
            {goal.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {goal.description}
              </CardDescription>
            )}
          </div>
          <GoalStatusBadge status={goal.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Progress Bar */}
        {goal.total_sessions > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {isActive && goal.current_streak > 0 && (
            <StreakBadge streak={goal.current_streak} size="sm" />
          )}
          
          {goal.total_sessions > 0 && (
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>
                {goal.completed_sessions}/{goal.total_sessions} sessions
              </span>
            </div>
          )}

          {checkpointCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              <span>
                {checkpointCount} checkpoint{checkpointCount !== 1 ? 's' : ''}
                {pendingCheckpoints > 0 && (
                  <span className="text-orange-500 ml-1">({pendingCheckpoints} pending)</span>
                )}
              </span>
            </div>
          )}

          {goal.start_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(goal.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/goals/${goal.id}`);
            }}
          >
            View Details
          </Button>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/goals/${goal.id}/edit`);
              }}
            >
              Edit
            </Button>
          )}
          
          {/* Checkpoints can be managed at any status */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/goals/${goal.id}/edit?tab=checkpoints`);
            }}
            title="Manage checkpoints"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>

          {canStart && (
            <Button
              size="sm"
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement start goal action
              }}
            >
              Start Goal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
