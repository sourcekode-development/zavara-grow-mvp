import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ClaimAuditTimeline } from '../components/claim-audit-timeline';
import { KpiPreviewDrawer } from '../components/kpi-preview-drawer';
import { ClaimReviewDialog } from '../components/claim-review-dialog';
import { ClaimStatusBadge } from '../components/claim-status-badge';
import {
  useAssignedKpi,
  useAssignedKpis,
  useKpiActions,
  useKpiClaimsWorkspace,
} from '../hooks/useKpis';
import { useKpisStore } from '../store/kpis.store';
import type { Claim, KpiMetricProgress } from '../types';

export const KpiClaimsPage = () => {
  const { user } = useAuthStore();
  const { claimsTab, setClaimsTab } = useKpisStore();
  const { submitted, pendingReview, isLoading, refetch } = useKpiClaimsWorkspace({
    submitter_id: user?.id,
    reviewer_id: user?.id,
  });
  const { kpis: reviewKpis } = useAssignedKpis({
    reviewer_id: user?.id,
    status: 'ALL',
  });
  const { reviewClaim } = useKpiActions();
  const [reviewTarget, setReviewTarget] = useState<{
    claim: Claim;
    metric: KpiMetricProgress;
  } | null>(null);
  const [previewClaim, setPreviewClaim] = useState<Claim | null>(null);
  const { kpi: previewKpi, isLoading: isPreviewLoading } = useAssignedKpi(previewClaim?.kpi_id);

  const metricMap = useMemo(() => {
    const entries = new Map<string, KpiMetricProgress>();
    reviewKpis.forEach((kpi) => {
      kpi.dimensions.forEach((dimension) => {
        dimension.metrics.forEach((metric) => {
          entries.set(metric.kpi_metric_id, metric);
        });
      });
    });
    return entries;
  }, [reviewKpis]);

  const getLatestFeedbackComment = (claim: Claim) =>
    [...(claim.audit_logs || [])]
      .reverse()
      .find((log) => log.comment_text?.trim()) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Claims</h1>
        <p className="mt-1 text-muted-foreground">
          Track your submitted claims and the items waiting for your review.
        </p>
      </div>

      <Tabs value={claimsTab} onValueChange={(value) => setClaimsTab(value as 'submitted' | 'pending')}>
        <TabsList className="w-full justify-start bg-white dark:bg-[#1A2633]">
          <TabsTrigger value="submitted">Submitted By You</TabsTrigger>
          <TabsTrigger value="pending">Needs Your Review</TabsTrigger>
        </TabsList>

        <TabsContent value="submitted" className="mt-6">
          <div className="grid gap-4">
            {isLoading ? <div className="text-sm text-muted-foreground">Loading claims...</div> : null}
            {!isLoading && submitted.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
                No submitted claims yet.
              </div>
            ) : null}
            {submitted.map((claim) => (
              <Card
                key={claim.id}
                role="button"
                tabIndex={0}
                className="cursor-pointer transition-colors hover:border-[#3DCF8E]/40 hover:bg-[#3DCF8E]/5"
                onClick={() => setPreviewClaim(claim)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setPreviewClaim(claim);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">Claim #{claim.id.slice(0, 8)}</CardTitle>
                    <ClaimStatusBadge status={claim.status} />
                    {claim.awarded_points ? (
                      <Badge variant="outline">{claim.awarded_points} pts</Badge>
                    ) : null}
                    {claim.is_impact_metric ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200">
                        Impact Metric
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-sm">{claim.evidence_text}</p>
                  {getLatestFeedbackComment(claim) ? (
                    <div className="rounded-xl border border-[#3DCF8E]/25 bg-[#3DCF8E]/8 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#208d61] dark:text-[#79e8b4]">
                        Feedback Comment
                      </div>
                      <p className="mt-2 text-sm">
                        {getLatestFeedbackComment(claim)?.comment_text}
                      </p>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Click to view the full KPI and highlighted claimed metric.
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPreviewClaim(claim);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View KPI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="grid gap-4">
            {isLoading ? <div className="text-sm text-muted-foreground">Loading review queue...</div> : null}
            {!isLoading && pendingReview.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-muted-foreground">
                No pending reviews right now.
              </div>
            ) : null}
            {pendingReview.map((claim) => {
              const metric = metricMap.get(claim.kpi_metric_id);
              return (
                <Card
                  key={claim.id}
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer transition-colors hover:border-[#3DCF8E]/40 hover:bg-[#3DCF8E]/5"
                  onClick={() => setPreviewClaim(claim)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setPreviewClaim(claim);
                    }
                  }}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        {metric?.name || claim.metric_name || `Claim #${claim.id.slice(0, 8)}`}
                      </CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{claim.submitter?.full_name || 'Unknown user'}</span>
                        {claim.is_impact_metric ? (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200">
                            Impact Metric
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <ClaimStatusBadge status={claim.status} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-sm">{claim.evidence_text}</p>
                    {getLatestFeedbackComment(claim) ? (
                      <div className="rounded-xl border border-[#3DCF8E]/25 bg-[#3DCF8E]/8 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#208d61] dark:text-[#79e8b4]">
                          Feedback Comment
                        </div>
                        <p className="mt-2 text-sm">
                          {getLatestFeedbackComment(claim)?.comment_text}
                        </p>
                      </div>
                    ) : null}
                    {claim.audit_logs?.length ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Audit Trail</h4>
                        <ClaimAuditTimeline logs={claim.audit_logs} />
                      </div>
                    ) : null}
                    {metric ? (
                      <div className="text-sm text-muted-foreground">
                        Remaining: {metric.remaining_points} / {metric.max_points}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-muted-foreground">
                        Open the full KPI to review this claim in its full scoring context.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPreviewClaim(claim);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          View KPI
                        </Button>
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (metric) {
                              setReviewTarget({ claim, metric });
                            }
                          }}
                          className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
                          disabled={!metric}
                        >
                          Review Claim
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

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

      <KpiPreviewDrawer
        open={Boolean(previewClaim)}
        onOpenChange={(open) => !open && setPreviewClaim(null)}
        kpi={previewKpi || null}
        claim={previewClaim}
        highlightedMetricId={previewClaim?.kpi_metric_id}
        isLoading={isPreviewLoading}
      />
    </div>
  );
};
