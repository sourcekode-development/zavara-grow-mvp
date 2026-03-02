import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DeveloperKpiWithMetrics } from '../types';

interface KpiProgressCardProps {
  kpi: DeveloperKpiWithMetrics;
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

export const KpiProgressCard = ({ kpi }: KpiProgressCardProps) => {
  const totalProgress = calculateTotalProgress(kpi);

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{kpi.title}</span>
              <Badge
                className={
                  kpi.status === 'ACTIVE'
                    ? 'bg-[#3DCF8E]'
                    : kpi.status === 'COMPLETED'
                      ? 'bg-blue-500'
                      : 'bg-gray-500'
                }
              >
                {kpi.status}
              </Badge>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {kpi.metrics.reduce((sum, m) => sum + m.accumulated_points, 0)}{' '}
                / {kpi.metrics.reduce((sum, m) => sum + m.target_points, 0)}{' '}
                points
              </span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metrics Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpi.metrics && kpi.metrics.length > 0 ? (
              kpi.metrics.map((metric) => {
                const metricProgress = calculateMetricProgress(
                  metric.accumulated_points,
                  metric.target_points
                );

                return (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">
                          {metric.name}
                        </h4>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {metric.target_points} pts
                      </Badge>
                    </div>
                    <Progress value={metricProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {metric.accumulated_points} / {metric.target_points}{' '}
                        points
                      </span>
                      <span>{Math.round(metricProgress)}%</span>
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

      {/* Additional Info */}
      {kpi.assigner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium">Assigned By: </span>
              <span className="text-sm text-muted-foreground">
                {kpi.assigner.full_name}
              </span>
            </div>
            <div className="flex gap-4 text-sm">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};
