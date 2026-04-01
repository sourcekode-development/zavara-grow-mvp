import { Trophy, Sparkles, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { AssignedKpi } from '../types';

interface KpiProgressHeaderProps {
  kpi: AssignedKpi;
}

export const KpiProgressHeader = ({ kpi }: KpiProgressHeaderProps) => {
  const progressValue =
    kpi.total_target_points > 0
      ? Math.min((kpi.baseline_progress / kpi.total_target_points) * 100, 100)
      : 0;

  return (
    <div className="space-y-4">
      <Card className="border-border/70 bg-gradient-to-br from-background via-background to-[#3DCF8E]/5">
        <CardContent className="grid gap-4 py-6 md:grid-cols-3">
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Baseline
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Target className="h-5 w-5 text-[#3DCF8E]" />
              {kpi.baseline_progress}/{kpi.total_target_points}
            </div>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Bonus
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Sparkles className="h-5 w-5 text-[#3DCF8E]" />
              {kpi.bonus_progress}
            </div>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Display Score
            </div>
            <div className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Trophy className="h-5 w-5 text-[#3DCF8E]" />
              {kpi.display_score}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Baseline progress</span>
          <span className="text-muted-foreground">{progressValue.toFixed(0)}%</span>
        </div>
        <Progress value={progressValue} className="mt-3" />
      </div>
    </div>
  );
};
