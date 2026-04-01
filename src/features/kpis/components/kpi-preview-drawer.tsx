import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { ClaimAuditTimeline } from './claim-audit-timeline';
import { ClaimStatusBadge } from './claim-status-badge';
import { KpiProgressHeader } from './kpi-progress-header';
import { ScopeBadge } from './scope-badge';
import type { AssignedKpi, Claim } from '../types';

interface KpiPreviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: AssignedKpi | null;
  claim?: Claim | null;
  highlightedMetricId?: string | null;
  isLoading?: boolean;
}

const getLatestFeedbackComment = (claim?: Claim | null) => {
  if (!claim?.audit_logs?.length) return null;

  const commentLog = [...claim.audit_logs]
    .reverse()
    .find((log) => log.comment_text?.trim());

  return commentLog || null;
};

export const KpiPreviewDrawer = ({
  open,
  onOpenChange,
  kpi,
  claim,
  highlightedMetricId,
  isLoading = false,
}: KpiPreviewDrawerProps) => {
  const feedbackComment = getLatestFeedbackComment(claim);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-6xl overflow-y-auto overflow-x-clip p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {kpi?.template?.name || 'KPI Preview'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Review the full KPI snapshot and the exact metric this claim was raised against.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
            Loading KPI details...
          </div>
        ) : null}

        {!isLoading && !kpi ? (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center text-sm text-muted-foreground">
            KPI details are unavailable for this claim.
          </div>
        ) : null}

        {kpi ? (
          <div className="space-y-6">
            {claim ? (
              <Card className="border-[#3DCF8E]/30 bg-gradient-to-br from-[#3DCF8E]/8 via-background to-background">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">Claim Summary</CardTitle>
                    <ClaimStatusBadge status={claim.status} />
                    {claim.awarded_points ? (
                      <Badge variant="outline">{claim.awarded_points} pts</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Submitted by {claim.submitter?.full_name || 'Unknown user'}</span>
                    <span>
                      KPI period {kpi.start_date} to {kpi.end_date}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Evidence
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{claim.evidence_text}</p>
                  </div>

                  {feedbackComment ? (
                    <div className="rounded-xl border border-[#3DCF8E]/30 bg-[#3DCF8E]/8 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-[#208d61] dark:text-[#79e8b4]">
                        Feedback Comment
                      </div>
                      <p className="mt-2 text-sm">
                        {feedbackComment.comment_text}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {feedbackComment.actor?.full_name || 'Reviewer'} • {new Date(feedbackComment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Audit Trail</h4>
                    <ClaimAuditTimeline logs={claim.audit_logs || []} />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {kpi.template?.name || 'Assigned KPI'}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {kpi.start_date} to {kpi.end_date}
                  </span>
                  <Badge variant={kpi.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {kpi.status.toLowerCase()}
                  </Badge>
                  <span>{kpi.reviewers.length} reviewers</span>
                </div>
              </div>
              {highlightedMetricId ? (
                <div className="rounded-xl border border-[#3DCF8E]/30 bg-[#3DCF8E]/8 px-4 py-3 text-sm">
                  <div className="font-medium text-[#208d61] dark:text-[#79e8b4]">
                    Highlighted metric
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    The claimed metric is visually emphasized below.
                  </div>
                </div>
              ) : null}
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
                    <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                      {dimensionGroup.metrics.length} metrics
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dimensionGroup.metrics.map((metric) => {
                      const isHighlighted = metric.kpi_metric_id === highlightedMetricId;

                      return (
                        <div
                          key={metric.kpi_metric_id}
                          className={cn(
                            'rounded-2xl border p-4 transition-colors',
                            isHighlighted
                              ? 'border-[#3DCF8E] bg-[#3DCF8E]/8 shadow-[0_0_0_1px_rgba(61,207,142,0.18)]'
                              : 'border-border'
                          )}
                        >
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
                                {isHighlighted ? (
                                  <Badge className="bg-[#3DCF8E] text-white hover:bg-[#3DCF8E]">
                                    Claimed metric
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

                          <div className="mt-4 space-y-3">
                            <h4 className="text-sm font-semibold">Claims</h4>
                            {metric.claims.length === 0 ? (
                              <div className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">
                                No claims submitted yet.
                              </div>
                            ) : (
                              metric.claims.map((metricClaim) => {
                                const metricClaimFeedback = getLatestFeedbackComment(metricClaim);

                                return (
                                  <div
                                    key={metricClaim.id}
                                    className={cn(
                                      'rounded-xl border p-3',
                                      metricClaim.id === claim?.id
                                        ? 'border-[#3DCF8E]/40 bg-[#3DCF8E]/6'
                                        : 'border-border'
                                    )}
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <ClaimStatusBadge status={metricClaim.status} />
                                      <span className="text-sm font-medium">
                                        {metricClaim.submitter?.full_name || 'Unknown user'}
                                      </span>
                                      {metricClaim.awarded_points ? (
                                        <Badge variant="outline">
                                          {metricClaim.awarded_points} pts
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="mt-3 whitespace-pre-wrap text-sm">
                                      {metricClaim.evidence_text}
                                    </p>
                                    {metricClaimFeedback ? (
                                      <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                                        <div className="font-medium">Feedback Comment</div>
                                        <p className="mt-1 text-muted-foreground">
                                          {metricClaimFeedback.comment_text}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
};
