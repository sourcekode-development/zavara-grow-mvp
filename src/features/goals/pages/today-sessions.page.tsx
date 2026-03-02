import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Target, Flame } from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useTodaysSessions, useSessionMutations } from '../hooks/useSessions';
import { SessionCard } from '../components/session-card';
import { EmptyState } from '../components/empty-state';
import { toast } from 'sonner';

export const TodaySessionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { todaysSessions, isLoading, error, refetch } = useTodaysSessions(user?.id);
  const { startSession, completeSession, isLoading: mutationLoading } = useSessionMutations();

  const handleStartSession = async (sessionId: string) => {
    await startSession(sessionId);
    toast.success('Session started!');
    // Refetch to get updated data
    refetch();
  };

  const handleCompleteSession = async (sessionId: string) => {
    await completeSession(sessionId);
    toast.success('Session completed! 🎉');
    // Refetch to get updated data
    refetch();
  };

  const scheduledSessions = todaysSessions.filter((s) => s.status === 'TO_DO');
  const inProgressSessions = todaysSessions.filter((s) => s.status === 'IN_PROGRESS');
  const completedSessions = todaysSessions.filter((s) => s.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Today's Sessions</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
        <Button
          onClick={() => navigate('/goals')}
          variant="outline"
        >
          <Target className="h-4 w-4 mr-2" />
          View All Goals
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Sessions waiting to start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#3DCF8E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">
              {inProgressSessions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active sessions right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSessions.length}</div>
            <p className="text-xs text-muted-foreground">
              Keep the streak going! 🔥
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && todaysSessions.length === 0 && (
        <EmptyState
          icon={Calendar}
          title="No Sessions Today"
          description="You don't have any sessions scheduled for today. Create a goal to get started!"
          actionLabel="Create Goal"
          onAction={() => navigate('/goals/create')}
        />
      )}

      {/* Session Lists */}
      {!isLoading && todaysSessions.length > 0 && (
        <div className="space-y-6">
          {/* In Progress Sessions */}
          {inProgressSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-[#3DCF8E]">
                In Progress ({inProgressSessions.length})
              </h2>
              <div className="space-y-3">
                {inProgressSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onComplete={handleCompleteSession}
                    isLoading={mutationLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Sessions */}
          {scheduledSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">
                Scheduled ({scheduledSessions.length})
              </h2>
              <div className="space-y-3">
                {scheduledSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onStart={handleStartSession}
                    isLoading={mutationLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">
                Completed Today ({completedSessions.length})
              </h2>
              <div className="space-y-3">
                {completedSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isLoading={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
