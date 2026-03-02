import { useState, useEffect } from 'react';
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
import { MilestoneEditor } from '../components/milestone-editor';
import { FrequencyConfigForm } from '../components/frequency-config-form';
import { SessionsEditor } from '../components/sessions-editor';
import { useSessionMutations } from '../hooks/useSessions';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { CheckpointsEditor } from '../components/checkpoints-editor';
import { toast } from 'sonner';
import type { Milestone, FrequencyType, FrequencyConfig, CadenceSession, CreateSessionRequest, CreateCheckpointRequest } from '../types';
import * as milestonesApi from '../apis/milestones.api';

export const GoalEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { goal, isLoading: goalLoading, refetch: refetchGoal } = useGoal(id || '');
  const { updateGoal, isLoading: updateLoading } = useGoalMutations();
  const { createSession, updateSession, deleteSession, isLoading: sessionLoading } = useSessionMutations();
  const { createCheckpoint, deleteCheckpoint, isLoading: checkpointLoading } = useCheckpoints();

  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'basics');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestones: [] as Partial<Milestone>[],
    frequencyType: null as FrequencyType | null,
    frequencyConfig: null as FrequencyConfig | null,
  });
  const [originalMilestones, setOriginalMilestones] = useState<Partial<Milestone>[]>([]);

  // Load goal data when it's available
  useEffect(() => {
    if (goal) {
      const milestones = goal.milestones || [];
      setFormData({
        title: goal.title,
        description: goal.description || '',
        milestones: milestones,
        frequencyType: goal.frequency_type,
        frequencyConfig: goal.frequency_config,
      });
      setOriginalMilestones(milestones); // Store original for comparison
    }
  }, [goal]);

  const handleSave = async () => {
    if (!id || !formData.title) {
      toast.error('Please enter a goal title');
      console.log('💾 Updating goal with milestones:', {
        goalId: id,
        milestonesCount: formData.milestones.length,
        originalCount: originalMilestones.length,
      });
      return;
  }

    try {
      // Step 1: Update goal basic info
      await updateGoal(id, {
        title: formData.title,
        description: formData.description || undefined,
        frequency_type: formData.frequencyType,
        frequency_config: formData.frequencyConfig,
      });

      console.log('✅ Goal basic info updated');

      // Step 2: Handle milestone changes
      const currentMilestoneIds = formData.milestones
        .filter(m => m.id)
        .map(m => m.id) as string[];
      const originalMilestoneIds = originalMilestones
        .filter(m => m.id)
        .map(m => m.id) as string[];

      // Delete removed milestones
      const deletedIds = originalMilestoneIds.filter(id => !currentMilestoneIds.includes(id));
      if (deletedIds.length > 0) {
        console.log('🗑️  Deleting', deletedIds.length, 'milestones');
        await Promise.all(
          deletedIds.map(milestoneId => 
            milestonesApi.deleteMilestone(milestoneId).catch(err => {
              console.warn(`Failed to delete milestone ${milestoneId}:`, err.message);
              // Continue even if delete fails (might have sessions)
            })
          )
        );
      }

      // Update existing milestones
      const updatePromises = formData.milestones
        .filter(m => m.id && m.title)
        .map(milestone => 
          milestonesApi.updateMilestone(milestone.id!, {
            title: milestone.title!,
            description: milestone.description || undefined,
            order_index: milestone.order_index || 1,
            duration_days: milestone.duration_days || undefined,
          })
        );

      if (updatePromises.length > 0) {
        console.log('📝 Updating', updatePromises.length, 'existing milestones');
        await Promise.all(updatePromises);
      }

      // Create new milestones
      const newMilestones = formData.milestones.filter(m => !m.id && m.title);
      if (newMilestones.length > 0) {
        console.log('➕ Creating', newMilestones.length, 'new milestones');
        const createPromises = newMilestones.map((milestone, index) =>
          milestonesApi.createMilestone({
            goal_id: id,
            title: milestone.title!,
            description: milestone.description || undefined,
            order_index: milestone.order_index || (formData.milestones.length + index + 1),
            duration_days: milestone.duration_days || undefined,
          })
        );
        await Promise.all(createPromises);
      }

      console.log('✅ All milestone changes saved');
      toast.success('Goal updated successfully with milestones');
      navigate(`/goals/${id}`);
    } catch (error) {
      console.error('❌ Error updating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    }
    toast.success('Goal updated successfully');
    navigate(`/goals/${id}`);
  };

  const handleAddSession = async (sessionData: Partial<CadenceSession>) => {
    if (!id) return;
    const requestData: CreateSessionRequest = {
      goal_id: id,
      milestone_id: sessionData.milestone_id || undefined,
      title: sessionData.title || undefined,
      description: sessionData.description || undefined,
      scheduled_date: sessionData.scheduled_date || undefined,
      duration_minutes: sessionData.duration_minutes,
    };
    const session = await createSession(requestData);
    if (session) {
      toast.success('Session added successfully');
    }
  };

  const handleUpdateSession = async (sessionId: string, sessionData: Partial<CadenceSession>) => {
    await updateSession(sessionId, {
      ...sessionData,
      milestone_id: sessionData.milestone_id || undefined,
    });
    toast.success('Session updated successfully');
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    toast.success('Session deleted successfully');
  };

  const handleAddCheckpoint = async (data: CreateCheckpointRequest) => {
    if (!id) return;
    await createCheckpoint(data);
    // Refetch goal to show the new checkpoint
    refetchGoal();
  };

  const handleUpdateCheckpoint = async () => {
    // For now, delete and recreate since we don't have an update method in the API
    // In production, you'd want a proper update endpoint
    toast.info('Checkpoint updates will be available soon');
  };

  const handleDeleteCheckpoint = async (checkpointId: string) => {
    await deleteCheckpoint(checkpointId);
    // Refetch goal to update the checkpoints list
    refetchGoal();
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

  const isLoading = updateLoading || sessionLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/goals/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Goal</h1>
          <p className="text-muted-foreground mt-1">
            Update goal details, milestones, frequency, and sessions
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!formData.title || isLoading}
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Multi-Tab Form */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="frequency">Frequency</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
            </TabsList>

            {/* Tab 1: Basics */}
            <TabsContent value="basics" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Goal Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., AWS Solutions Architect Certification"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what you want to achieve and why..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Milestones */}
            <TabsContent value="milestones" className="space-y-6">
              <MilestoneEditor
                milestones={formData.milestones}
                onChange={(milestones) =>
                  setFormData({ ...formData, milestones })
                }
              />
            </TabsContent>

            {/* Tab 3: Frequency */}
            <TabsContent value="frequency" className="space-y-6">
              <FrequencyConfigForm
                frequencyType={formData.frequencyType}
                frequencyConfig={formData.frequencyConfig}
                onChange={(type, config) =>
                  setFormData({
                    ...formData,
                    frequencyType: type,
                    frequencyConfig: config,
                  })
                }
              />
            </TabsContent>

            {/* Tab 4: Sessions */}
            <TabsContent value="sessions" className="space-y-6">
              <SessionsEditor
                sessions={goal.active_sessions || []}
                goalId={id!}
                milestones={goal.milestones?.map((m) => ({ id: m.id, title: m.title }))}
                onAddSession={handleAddSession}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
                isLoading={sessionLoading}
              />
            </TabsContent>

            {/* Tab 5: Checkpoints */}
            <TabsContent value="checkpoints" className="space-y-6">
              <CheckpointsEditor
                checkpoints={goal.checkpoints || []}
                goalId={id!}
                milestones={goal.milestones?.map((m) => ({ id: m.id, title: m.title }))}
                onAddCheckpoint={handleAddCheckpoint}
                onUpdateCheckpoint={handleUpdateCheckpoint}
                onDeleteCheckpoint={handleDeleteCheckpoint}
                isLoading={checkpointLoading}
                canEdit={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            💡 <strong>Tip:</strong> Changes are saved when you click "Save Changes". 
            You can switch between tabs to update different aspects of your goal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
