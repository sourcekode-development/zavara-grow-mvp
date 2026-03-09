import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StreakBadge } from './streak-badge';
import type { GoalWithDetails } from '../types';
import { Calendar, Target, TrendingUp } from 'lucide-react';

interface GoalProgressProps {
  goal: GoalWithDetails;
}

export const GoalProgress = ({ goal }: GoalProgressProps) => {
  const totalEffort = Number(goal.effort ?? 0);
  const completedEffort = Number(goal.completed_effort ?? 0);
  const remainingEffort = Math.max(Number((totalEffort - completedEffort).toFixed(2)), 0);
  const progressPercentage =
    totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

  const stats = [
    {
      label: 'Total Effort',
      value: totalEffort,
      icon: Target,
    },
    {
      label: 'Completed',
      value: completedEffort,
      icon: TrendingUp,
    },
    {
      label: 'Remaining',
      value: remainingEffort,
      icon: Calendar,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-2xl font-bold text-[#3DCF8E]">
              {progressPercentage}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <Icon className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Streak */}
        {/* {goal.current_streak > 0 && ( */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Streak</p>
              <p className="text-xs text-muted-foreground">
                Longest: {goal.longest_streak} days
              </p>
            </div>
            <StreakBadge streak={goal.current_streak} size="lg" />
          </div>
        </div>
        {/* )} */}
      </CardContent>
    </Card>
  );
};
