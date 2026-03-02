import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyKpisProgress } from '../components/MyKpisProgress';
import { SubmitClaimDialog } from '../components/SubmitClaimDialog';
import { MySubmissionsTable } from '../components/MySubmissionsTable';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { developerKpisRepository } from '../repository/developer-kpis.repository';
import { useSubmissions } from '../hooks/useSubmissions';
import type { DeveloperKpiWithMetrics } from '../types';

export const YourKpisPage = () => {
  const { user } = useAuthStore();
  const [activeKpi, setActiveKpi] = useState<DeveloperKpiWithMetrics | null>(
    null
  );
  const [isLoadingKpi, setIsLoadingKpi] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  // Fetch developer's own submissions
  const { submissions, isLoading: isLoadingSubmissions, refetch } = useSubmissions();

  // Fetch active KPI for the logged-in developer
  useEffect(() => {
    const fetchActiveKpi = async () => {
      if (!user?.profile?.id) {
        setIsLoadingKpi(false);
        return;
      }

      setIsLoadingKpi(true);
      const { data } = await developerKpisRepository.getActiveForUser(user.profile.id);
      setActiveKpi(data);
      setIsLoadingKpi(false);
    };
    
    fetchActiveKpi();
  }, [user?.profile?.id]);

  const handleSubmitClaim = (metricId: string) => {
    setSelectedMetricId(metricId);
    setSubmitDialogOpen(true);
  };

  const handleClaimSuccess = () => {
    // Refetch active KPI to update progress
    if (user?.profile?.id) {
      developerKpisRepository
        .getActiveForUser(user.profile.id)
        .then(({ data }) => {
          setActiveKpi(data);
        });
    }
    // Refetch submissions
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Your KPIs</h1>
        <p className="text-muted-foreground mt-1">
          Track your performance and submit claims for your achievements
        </p>
      </div>

      {/* Content */}
      {isLoadingKpi ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading your KPI...
        </div>
      ) : !activeKpi ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                You don't have an active KPI assigned yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact your team lead to get a KPI assigned.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <MyKpisProgress kpi={activeKpi} onSubmitClaim={handleSubmitClaim} />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {isLoadingSubmissions ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading submissions...
                  </div>
                ) : (
                  <MySubmissionsTable submissions={submissions} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Submit Claim Dialog */}
      <SubmitClaimDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        metricId={selectedMetricId}
        onSuccess={handleClaimSuccess}
      />
    </div>
  );
};