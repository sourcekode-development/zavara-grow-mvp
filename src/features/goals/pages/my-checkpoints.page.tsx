import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertCircle, Target } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCheckpoints } from '../hooks/useCheckpoints';
import { CheckpointCard } from '../components/checkpoint-card';
import { AssessmentViewDialog } from '../components/assessment-view-dialog';
import { EmptyState } from '../components/empty-state';
import type { CheckpointStatus, Assessment } from '../types';

export const MyCheckpointsPage = () => {
  const { user } = useAuthStore();
  const { checkpoints, isLoading, error, loadCheckpoints, markCheckpointReady, getAssessment } = useCheckpoints();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'ready' | 'passed' | 'failed'>('all');
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Load all checkpoints for the user's goals
      loadCheckpoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleMarkReady = async (checkpointId: string) => {
    const success = await markCheckpointReady(checkpointId);
    if (success) {
      loadCheckpoints(); // Refresh
    }
  };

  const handleViewAssessment = async (checkpointId: string) => {
    const assessment = await getAssessment(checkpointId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setShowAssessmentDialog(true);
    }
  };

  // Filter by status
  const filterCheckpoints = (status?: CheckpointStatus | CheckpointStatus[]) => {
    if (!status) return checkpoints;
    if (Array.isArray(status)) {
      return checkpoints.filter((c) => status.includes(c.status));
    }
    return checkpoints.filter((c) => c.status === status);
  };

  const getFilteredCheckpoints = () => {
    switch (activeTab) {
      case 'pending':
       return filterCheckpoints('PENDING');
      case 'ready':
        return filterCheckpoints(['READY_FOR_REVIEW', 'REVIEW_IN_PROGRESS']);
      case 'passed':
        return filterCheckpoints('PASSED');
      case 'failed':
        return filterCheckpoints(['FAILED', 'NEEDS_ATTENTION']);
      default:
        return checkpoints;
    }
  };

  const filteredCheckpoints = getFilteredCheckpoints();

  // Calculate stats
  const stats = {
    total: checkpoints.length,
    pending: filterCheckpoints('PENDING').length,
    ready: filterCheckpoints(['READY_FOR_REVIEW', 'REVIEW_IN_PROGRESS']).length,
    passed: filterCheckpoints('PASSED').length,
    needsAttention: filterCheckpoints(['FAILED', 'NEEDS_ATTENTION']).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Checkpoints</h1>
        <p className="text-muted-foreground mt-1">
          Track your progress validation checkpoints across all goals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-900/30">
                <Target className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm text-muted-foreground">In Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.passed}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.needsAttention}</p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="ready">
            In Review ({stats.ready})
          </TabsTrigger>
          <TabsTrigger value="passed">
            Passed ({stats.passed})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Need Attention ({stats.needsAttention})
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        {['all', 'pending', 'ready', 'passed', 'failed'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Checkpoints List */}
            {!isLoading && filteredCheckpoints.length > 0 && (
              <div className="space-y-4">
                {filteredCheckpoints.map((checkpoint) => (
                  <CheckpointCard
                    key={checkpoint.id}
                    checkpoint={checkpoint}
                    onMarkReady={handleMarkReady}
                    onViewAssessment={handleViewAssessment}
                    isOwner={true}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredCheckpoints.length === 0 && (
              <EmptyState
                icon={Target}
                title={`No ${tab === 'all' ? '' : tab} checkpoints`}
                description={
                  tab === 'passed'
                    ? 'Complete checkpoints will appear here once reviewed and passed'
                    : tab === 'failed'
                    ? 'Checkpoints needing attention will appear here'
                    : 'Your checkpoints will appear here as you add them to goals'
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Assessment Dialog */}
      <AssessmentViewDialog
        open={showAssessmentDialog}
        onOpenChange={setShowAssessmentDialog}
        assessment={selectedAssessment}
      />
    </div>
  );
};
