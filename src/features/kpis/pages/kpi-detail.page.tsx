import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ClaimStatusBadge } from '../components/claim-status-badge';
import { ClaimSubmissionDialog } from '../components/claim-submission-dialog';
import { ImpactMetricDialog } from '../components/impact-metric-dialog';
import { KpiProgressHeader } from '../components/kpi-progress-header';
import { ScopeBadge } from '../components/scope-badge';
import { useAssignedKpi, useAvailableImpactMetrics, useKpiActions } from '../hooks/useKpis';
import type { Claim, KpiMetricProgress } from '../types';
import { ClaimReviewDialog } from '../components/claim-review-dialog';

export const KpiDetailPage = () => {
  const navigate = useNavigate();
  const { kpiId } = useParams<{ kpiId: string }>();
  const { user } = useAuthStore();
  const { kpi, isLoading, refetch } = useAssignedKpi(kpiId);
  const { metrics: impactMetrics } = useAvailableImpactMetrics(
    user?.profile?.company_id,
    kpiId
  );
  const { submitClaim, submitImpactClaim, reviewClaim } = useKpiActions();
  const [selectedMetric, setSelectedMetric] = useState<KpiMetricProgress | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [impactDialogOpen, setImpactDialogOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    claim: Claim;
    metric: KpiMetricProgress;
  } | null>(null);

  const canReview = useMemo(
    () => Boolean(user?.id && kpi?.reviewers.some((reviewer) => reviewer.reviewer_id === user.id)),
    [kpi?.reviewers, user?.id]
  );

  const openClaimDialog = (metric: KpiMetricProgress) => {
    setSelectedMetric(metric);
    setClaimDialogOpen(true);
  };

  if (!kpiId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading KPI...</div> : null}

      {kpi ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {kpi.template?.name || 'Assigned KPI'}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{kpi.start_date} to {kpi.end_date}</span>
                <Badge variant={kpi.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {kpi.status.toLowerCase()}
                </Badge>
              </div>
            </div>
            <Button
              className="bg-[#3DCF8E] hover:bg-[#2fb577]"
              onClick={() => setImpactDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Impact Metric
            </Button>
          </div>

          <KpiProgressHeader kpi={kpi} />

          <div className="grid gap-4">
            {kpi.dimensions.map((dimensionGroup) => (
              <Card key={dimensionGroup.dimension_id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{dimensionGroup.dimension.name}</CardTitle>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <ScopeBadge scope={dimensionGroup.dimension.scope} />
                      <span className="text-xs text-muted-foreground">
                        Weight {dimensionGroup.weight_percentage}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dimensionGroup.metrics.map((metric) => (
                    <div key={metric.kpi_metric_id} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{metric.name}</h3>
                            {metric.is_impact_metric ? (
                              <Badge variant="outline">Impact</Badge>
                            ) : null}
                            {metric.is_fully_awarded ? (
                              <Badge className="bg-[#3DCF8E]/15 text-[#208d61] dark:text-[#3DCF8E]">
                                Fully awarded
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {metric.description || 'No description provided.'}
                          </p>
                          {metric.how_to_measure ? (
                            <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                              {metric.how_to_measure}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid min-w-72 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Cap</div>
                            <div className="text-lg font-semibold">{metric.max_points}</div>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Approved</div>
                            <div className="text-lg font-semibold">{metric.approved_points}</div>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-3">
                            <div className="text-xs text-muted-foreground">Remaining</div>
                            <div className="text-lg font-semibold">{metric.remaining_points}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          disabled={metric.remaining_points === 0}
                          onClick={() => openClaimDialog(metric)}
                        >
                          Submit Claim
                        </Button>
                      </div>

                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-semibold">Claims</h4>
                        {metric.claims.length === 0 ? (
                          <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                            No claims submitted yet.
                          </div>
                        ) : (
                          metric.claims.map((claim) => (
                            <div key={claim.id} className="rounded-lg border p-3">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <ClaimStatusBadge status={claim.status} />
                                    <span className="text-sm font-medium">
                                      {claim.submitter?.full_name || 'Unknown user'}
                                    </span>
                                    {claim.awarded_points ? (
                                      <Badge variant="outline">
                                        {claim.awarded_points} pts
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <p className="mt-3 whitespace-pre-wrap text-sm">
                                    {claim.evidence_text}
                                  </p>
                                </div>
                                {canReview && claim.status === 'PENDING' ? (
                                  <Button
                                    onClick={() => setReviewTarget({ claim, metric })}
                                    className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
                                  >
                                    Review Claim
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}

      <ClaimSubmissionDialog
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        metric={selectedMetric}
        kpiId={kpiId}
        onSubmit={async (request) => {
          if (!user?.id) return;
          await submitClaim(user.id, request);
          toast.success('Claim submitted');
          await refetch();
        }}
      />

      <ImpactMetricDialog
        open={impactDialogOpen}
        onOpenChange={setImpactDialogOpen}
        kpiId={kpiId}
        metrics={impactMetrics}
        onSubmit={async (request) => {
          if (!user?.id) return;
          await submitImpactClaim(user.id, user.id, request);
          toast.success('Impact claim submitted');
          await refetch();
        }}
      />

      <ClaimReviewDialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => !open && setReviewTarget(null)}
        claim={reviewTarget?.claim || null}
        metric={reviewTarget?.metric || null}
        onSubmit={async (request) => {
          if (!user?.id || !reviewTarget) return;
          await reviewClaim(user.id, reviewTarget.claim.id, request);
          toast.success(`Claim ${request.status.toLowerCase()}`);
          setReviewTarget(null);
          await refetch();
        }}
      />
    </div>
  );
};
