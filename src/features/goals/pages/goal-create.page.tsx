import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useGoalMutations } from '../hooks/useGoals';
import { MilestoneEditor } from '../components/milestone-editor';
import { FrequencyConfigForm } from '../components/frequency-config-form';
import { toast } from 'sonner';
import type { Milestone, FrequencyType, FrequencyConfig } from '../types';
import * as milestonesApi from '../apis/milestones.api';

export const GoalCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createGoal, isLoading } = useGoalMutations();

  const [currentTab, setCurrentTab] = useState('basics');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestones: [] as Partial<Milestone>[],
    frequencyType: null as FrequencyType | null,
    frequencyConfig: null as FrequencyConfig | null,
  });

  const canProceedToMilestones = formData.title.trim().length > 0;
  const canProceedToFrequency = formData.milestones.length > 0;
  const canSave = canProceedToMilestones && canProceedToFrequency;

  const handleSaveDraft = async () => {
    if (!user?.id || !formData.title) {
      toast.error('Please enter a goal title');
      return;
    }

    console.log('💾 Saving goal draft with milestones:', {
      title: formData.title,
      milestonesCount: formData.milestones.length,
      milestones: formData.milestones,
    });

    try {
      // Step 1: Create the goal
      const goal = await createGoal(user.id, {
        title: formData.title,
        description: formData.description || undefined,
      });

      if (!goal) {
        toast.error('Failed to create goal');
        return;
      }

      console.log('✅ Goal created:', goal.id);

      // Step 2: Create milestones if any
      if (formData.milestones.length > 0) {
        console.log('📝 Creating', formData.milestones.length, 'milestones...');
        
        const milestonePromises = formData.milestones.map((milestone, index) => {
          if (!milestone.title) {
            console.warn('⚠️ Skipping milestone without title at index', index);
            return null;
          }
          
          return milestonesApi.createMilestone({
            goal_id: goal.id,
            title: milestone.title,
            description: milestone.description || undefined,
            order_index: milestone.order_index || index + 1,
            duration_days: milestone.duration_days || undefined,
          });
        });

        // Filter out null promises and wait for all milestone creations
        const validPromises = milestonePromises.filter(p => p !== null);
        await Promise.all(validPromises);
        
        console.log('✅ All milestones created successfully');
      }

      toast.success('Goal saved as draft with milestones');
      navigate(`/goals/${goal.id}`);
    } catch (error) {
      console.error('❌ Error saving goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save goal');
    }
  };

  const handleNext = () => {
    if (currentTab === 'basics' && canProceedToMilestones) {
      setCurrentTab('milestones');
    } else if (currentTab === 'milestones' && canProceedToFrequency) {
      setCurrentTab('frequency');
    }
  };

  const handleBack = () => {
    if (currentTab === 'frequency') {
      setCurrentTab('milestones');
    } else if (currentTab === 'milestones') {
      setCurrentTab('basics');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/goals')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Create New Goal</h1>
          <p className="text-muted-foreground mt-1">
            Plan your upskilling journey step by step
          </p>
        </div>
        <Button
          onClick={handleSaveDraft}
          disabled={!formData.title || isLoading}
          variant="outline"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
      </div>

      {/* Multi-Step Form */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basics">1. Basics</TabsTrigger>
              <TabsTrigger value="milestones" disabled={!canProceedToMilestones}>
                2. Milestones
              </TabsTrigger>
              <TabsTrigger value="frequency" disabled={!canProceedToFrequency}>
                3. Frequency
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Basics */}
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
                  <p className="text-xs text-muted-foreground">
                    Give your goal a clear, descriptive title
                  </p>
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

              <div className="flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToMilestones}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  Next: Add Milestones
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Step 2: Milestones */}
            <TabsContent value="milestones" className="space-y-6">
              <MilestoneEditor
                milestones={formData.milestones}
                onChange={(milestones) =>
                  setFormData({ ...formData, milestones })
                }
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToFrequency}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  Next: Set Frequency
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            {/* Step 3: Frequency */}
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

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  disabled={!canSave || isLoading}
                  className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            💡 <strong>Tip:</strong> Your goal will be saved as a draft. You can
            edit it later before submitting for review.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
