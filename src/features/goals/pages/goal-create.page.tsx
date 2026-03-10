import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useGoalMutations } from '../hooks/useGoals';
import { toast } from 'sonner';

export const GoalCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createGoal, isLoading } = useGoalMutations();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    effort: '',
    effort_description: '',
  });

  const handleSaveDraft = async () => {
    if (!user?.id || !formData.title.trim()) {
      toast.error('Please enter a goal title');
      return;
    }

    const parsedEffort = Number(formData.effort);
    if (!Number.isFinite(parsedEffort) || parsedEffort <= 0) {
      toast.error('Please enter a valid total effort value');
      return;
    }

    try {
      const goal = await createGoal(user.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        effort: parsedEffort,
        effort_description: formData.effort_description.trim() || undefined,
      });

      if (!goal) {
        toast.error('Failed to create goal');
        return;
      }

      toast.success('Goal saved as draft');
      navigate(`/goals/${goal.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/goals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Goal</h1>
          <p className="text-muted-foreground mt-1">Define your goal with an effort-based target</p>
        </div>
        <Button
          onClick={handleSaveDraft}
          disabled={!formData.title.trim() || !formData.effort || isLoading}
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              placeholder="e.g., Become confident with system design interviews"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the outcome you want to achieve"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effort">Total Effort Required <span className="text-red-500">*</span></Label>
            <Input
              id="effort"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g., 30"
              value={formData.effort}
              onChange={(e) => setFormData({ ...formData, effort: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="effortDescription">Effort Description (Optional)</Label>
            <Textarea
              id="effortDescription"
              placeholder="e.g., 1 effort = 2 hours of study"
              value={formData.effort_description}
              onChange={(e) => setFormData({ ...formData, effort_description: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
