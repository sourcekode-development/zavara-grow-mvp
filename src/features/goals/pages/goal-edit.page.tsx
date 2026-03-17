import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save } from 'lucide-react';
import { useGoal, useGoalMutations } from '../hooks/useGoals';
import { useSessionMutations } from '../hooks/useSessions';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { CheckpointsEditor } from '../components/checkpoints-editor';
import { SessionsEditor } from '../components/sessions-editor';
import { toast } from 'sonner';
import type { CadenceSession, CreateCheckpointRequest, CreateSessionRequest } from '../types';

export const GoalEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { goal, isLoading: goalLoading, refetch: refetchGoal } = useGoal(id || '');
  const { updateGoal, isLoading: updateLoading } = useGoalMutations();
  const { createSession, updateSession, deleteSession, isLoading: sessionLoading, error: sessionError } = useSessionMutations();
  const { createCheckpoint, deleteCheckpoint, isLoading: checkpointLoading } = useCheckpoints();

  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'basics');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    effort: '',
    effort_description: '',
    duration_months: '',
  });

  useEffect(() => {
    if (!goal) return;

    setFormData({
      title: goal.title,
      description: goal.description || '',
      effort: goal.effort?.toString() || '',
      effort_description: goal.effort_description || '',
      duration_months: goal.duration_months?.toString() || '',
    });
  }, [goal]);

  const handleSave = async () => {
    if (!id || !formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    const parsedEffort = Number(formData.effort);
    if (!Number.isFinite(parsedEffort) || parsedEffort <= 0) {
      toast.error('Please enter a valid total effort value');
      return;
    }
    const parsedDurationMonths = Number(formData.duration_months);
    if (!Number.isInteger(parsedDurationMonths) || parsedDurationMonths <= 0) {
      toast.error('Please enter a valid duration in months');
      return;
    }

    try {
      await updateGoal(id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        effort: parsedEffort,
        effort_description: formData.effort_description.trim() || undefined,
        duration_months: parsedDurationMonths,
      });

      toast.success('Goal updated successfully');
      navigate(`/goals/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    }
  };

  const handleAddCheckpoint = async (data: CreateCheckpointRequest) => {
    if (!id) return;
    await createCheckpoint(data);
    await refetchGoal();
  };

  const handleUpdateCheckpoint = async () => {
    toast.info('Checkpoint editing will be available soon');
  };

  const handleDeleteCheckpoint = async (checkpointId: string) => {
    await deleteCheckpoint(checkpointId);
    await refetchGoal();
  };

  const handleAddSession = async (sessionData: Partial<CadenceSession>): Promise<boolean> => {
    if (!id) return false;

    const requestData: CreateSessionRequest = {
      goal_id: id,
      milestone_id: sessionData.milestone_id || undefined,
      title: sessionData.title || undefined,
      description: sessionData.description || undefined,
      scheduled_date: sessionData.scheduled_date || undefined,
      duration_minutes: sessionData.duration_minutes,
      session_effort: sessionData.session_effort || 1,
      completed_effort: sessionData.completed_effort ?? 0,
    };

    const session = await createSession(requestData);
    if (session) {
      toast.success('Session added successfully');
      await refetchGoal();
      return true;
    }
    toast.warning(
      sessionError || 'Total session effort cannot exceed goal effort. Please reduce session values.'
    );
    return false;
  };

  const handleUpdateSession = async (
    sessionId: string,
    sessionData: Partial<CadenceSession>
  ): Promise<boolean> => {
    const success = await updateSession(sessionId, {
      ...sessionData,
      milestone_id: sessionData.milestone_id || undefined,
    });
    if (success) {
      toast.success('Session updated successfully');
      await refetchGoal();
      return true;
    }
    toast.warning(
      sessionError || 'Total session effort cannot exceed goal effort. Please reduce session values.'
    );
    return false;
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    toast.success('Session deleted successfully');
    await refetchGoal();
  };

  if (goalLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Goal not found</p>
            <Button className="mt-4" onClick={() => navigate('/goals')}>
              Back to Goals
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRejectedGoal = goal.status === 'ABANDONED';
  const canCreateCheckpoints = goal.status === 'IN_PROGRESS';
  const canCreateSessions = !isRejectedGoal;
  const canEditSessionProgress = goal.status === 'IN_PROGRESS';
  const createBlockedReason = 'Goal is not started. Please start the goal first.';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/goals/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Goal</h1>
          <p className="text-muted-foreground mt-1">Update goal details and checkpoints</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!formData.title.trim() || !formData.effort || updateLoading}
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effort">Total Effort Required <span className="text-red-500">*</span></Label>
                <Input
                  id="effort"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.effort}
                  onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effortDescription">Effort Description (Optional)</Label>
                <Textarea
                  id="effortDescription"
                  rows={3}
                  value={formData.effort_description}
                  onChange={(e) => setFormData({ ...formData, effort_description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationMonths">Goal Duration (months) <span className="text-red-500">*</span></Label>
                <Input
                  id="durationMonths"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <SessionsEditor
                sessions={goal.active_sessions || []}
                goalId={id!}
                milestones={[]}
                onAddSession={handleAddSession}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
                isLoading={sessionLoading}
                canCreate={canCreateSessions}
                canEditProgress={canEditSessionProgress}
                hideCreateActions={isRejectedGoal}
                createBlockedReason={createBlockedReason}
              />
            </TabsContent>

            <TabsContent value="checkpoints" className="space-y-6">
              <CheckpointsEditor
                checkpoints={goal.checkpoints || []}
                goalId={id!}
                onAddCheckpoint={handleAddCheckpoint}
                onUpdateCheckpoint={handleUpdateCheckpoint}
                onDeleteCheckpoint={handleDeleteCheckpoint}
                isLoading={checkpointLoading}
                canEdit
                canCreate={canCreateCheckpoints}
                hideCreateActions={isRejectedGoal}
                createBlockedReason={createBlockedReason}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
