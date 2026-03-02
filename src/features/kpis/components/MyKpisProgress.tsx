import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { DeveloperKpiWithMetrics } from '../types';

interface MyKpisProgressProps {
  kpi: DeveloperKpiWithMetrics;
  onSubmitClaim: (metricId: string) => void;
}

const calculateTotalProgress = (kpi: DeveloperKpiWithMetrics): number => {
  if (!kpi.metrics || kpi.metrics.length === 0) return 0;

  const totalAccumulated = kpi.metrics.reduce(
    (sum, metric) => sum + metric.accumulated_points,
    0
  );
  const totalTarget = kpi.metrics.reduce(
    (sum, metric) => sum + metric.target_points,
    0
  );

  return totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0;
};

const calculateMetricProgress = (
  accumulated: number,
  target: number
): number => {
  return target > 0 ? (accumulated / target) * 100 : 0;
};

export const MyKpisProgress = ({ kpi, onSubmitClaim }: MyKpisProgressProps) => {
  const totalProgress = calculateTotalProgress(kpi);

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Your Active KPI</CardTitle>
            <Badge className="bg-[#3DCF8E]">{kpi.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold">{kpi.title}</h3>
            <Progress value={totalProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {kpi.metrics.reduce((sum, m) => sum + m.accumulated_points, 0)}{' '}
                / {kpi.metrics.reduce((sum, m) => sum + m.target_points, 0)}{' '}
                points
              </span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <div className="flex gap-4 text-sm mt-4">
              <div>
                <span className="font-medium">Start: </span>
                <span className="text-muted-foreground">
                  {kpi.start_date
                    ? new Date(kpi.start_date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              {kpi.end_date && (
                <div>
                  <span className="font-medium">End: </span>
                  <span className="text-muted-foreground">
                    {new Date(kpi.end_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpi.metrics && kpi.metrics.length > 0 ? (
              kpi.metrics.map((metric) => {
                const metricProgress = calculateMetricProgress(
                  metric.accumulated_points,
                  metric.target_points
                );
                const remaining =
                  metric.target_points - metric.accumulated_points;

                return (
                  <div
                    key={metric.id}
                    className="space-y-2 p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{metric.name}</h4>
                        {metric.category && (
                          <Badge variant="outline" className="mt-1">
                            {metric.category.name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onSubmitClaim(metric.id)}
                        disabled={remaining <= 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Claim
                      </Button>
                    </div>
                    <Progress value={metricProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {metric.accumulated_points} / {metric.target_points}{' '}
                        points
                      </span>
                      <span>
                        {remaining > 0
                          ? `${remaining} points remaining`
                          : 'Completed!'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No metrics available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
