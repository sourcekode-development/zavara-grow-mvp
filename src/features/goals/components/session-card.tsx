import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import type { CadenceSession, CadenceSessionStatus } from '../types';

interface SessionCardProps {
  session: CadenceSession;
  onStart?: (sessionId: string) => void;
  onComplete?: (sessionId: string) => void;
  isLoading?: boolean;
}

export const SessionCard = ({
  session,
  onStart,
  onComplete,
  isLoading = false,
}: SessionCardProps) => {
  const navigate = useNavigate();

  const statusConfig: Record<CadenceSessionStatus, { label: string; color: string }> = {
    TO_DO: { label: 'To Do', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    SKIPPED: { label: 'Skipped', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-[#3DCF8E]/20 text-[#3DCF8E] dark:bg-[#3DCF8E]/20' },
    DUE: { label: 'Due', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    MISSED: { label: 'Missed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = statusConfig[session.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-[#3DCF8E]" />
              <h3 
                className="font-semibold text-lg hover:text-[#3DCF8E] cursor-pointer transition-colors"
                onClick={() => navigate(`/goals/${session.goal_id}`)}
              >
                {session.goal?.title || 'Goal'}
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{session.scheduled_date ? format(new Date(session.scheduled_date), 'MMM dd, yyyy') : 'Not scheduled'}</span>
              </div>
              {session.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{session.duration_minutes} min</span>
                </div>
              )}
            </div>
          </div>
          <Badge className={config.color}>
            {config.label}
          </Badge>
        </div>

        {session.notes && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {session.notes}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {session.status === 'TO_DO' && (
            <>
              <Button
                onClick={() => onStart?.(session.id)}
                disabled={isLoading}
                size="sm"
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Start Session
              </Button>
              <Button
                onClick={() => navigate(`/goals/${session.goal_id}`)}
                variant="outline"
                size="sm"
              >
                View Goal
              </Button>
            </>
          )}

          {session.status === 'IN_PROGRESS' && (
            <>
              <Button
                onClick={() => onComplete?.(session.id)}
                disabled={isLoading}
                size="sm"
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Complete Session
              </Button>
              <Button
                onClick={() => navigate(`/goals/${session.goal_id}`)}
                variant="outline"
                size="sm"
              >
                View Goal
              </Button>
            </>
          )}

          {(session.status === 'COMPLETED' || session.status === 'SKIPPED') && (
            <Button
              onClick={() => navigate(`/goals/${session.goal_id}`)}
              variant="outline"
              size="sm"
            >
              View Goal
            </Button>
          )}
        </div>

        {/* Completed/Skipped Info */}
        {session.completed_at && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            Completed on {format(new Date(session.completed_at), 'MMM dd, yyyy h:mm a')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
