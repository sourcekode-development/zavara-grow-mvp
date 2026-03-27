import { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { TeamUpskillDashboardData } from '../types';
import { ProgramStatusBadge } from './program-status-badge';
import { TeamProgramDetailDrawer } from './team-program-detail-drawer';

const activityConfig = {
  effort: {
    label: 'Effort',
    color: '#3DCF8E',
  },
};

const frequencyConfig = {
  logs: {
    label: 'Logs',
    color: '#3DCF8E',
  },
};

type LeaderboardWindow = 'overall' | 'past_7_days';

const formatMetricValue = (value: number, metric: 'effort' | 'logs') =>
  metric === 'effort' ? value.toFixed(1) : value.toString();

const formatActivityDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString() : 'No activity yet';

const getGrowthTone = (growthPercentage: number) => {
  if (growthPercentage > 0) {
    return {
      icon: ArrowUpRight,
      className: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
      label: `+${growthPercentage}%`,
    };
  }

  if (growthPercentage < 0) {
    return {
      icon: ArrowDownRight,
      className: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
      label: `${growthPercentage}%`,
    };
  }

  return {
    icon: Minus,
    className: 'bg-muted text-muted-foreground',
    label: '0%',
  };
};

export const TeamUpskillDashboard = ({
  dashboard,
}: {
  dashboard: TeamUpskillDashboardData | null;
}) => {
  const [leaderboardWindow, setLeaderboardWindow] =
    useState<LeaderboardWindow>('overall');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  if (!dashboard) {
    return null;
  }

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId);
    setDetailDrawerOpen(true);
  };

  const effortLeaderboard = dashboard.member_snapshots
    .map((member) => ({
      ...member,
      metricValue:
        leaderboardWindow === 'overall'
          ? member.total_logged_effort
          : member.total_logged_effort_last_7_days,
      secondaryValue:
        leaderboardWindow === 'overall'
          ? member.total_logs
          : member.total_logs_last_7_days,
    }))
    .filter((member) => member.metricValue > 0)
    .sort(
      (a, b) =>
        b.metricValue - a.metricValue ||
        b.secondaryValue - a.secondaryValue ||
        a.full_name.localeCompare(b.full_name)
    )
    .slice(0, 10);

  const consistencyLeaderboard = dashboard.member_snapshots
    .map((member) => ({
      ...member,
      metricValue:
        leaderboardWindow === 'overall'
          ? member.total_logs
          : member.total_logs_last_7_days,
      secondaryValue:
        leaderboardWindow === 'overall'
          ? member.overall_current_streak
          : member.total_logged_effort_last_7_days,
    }))
    .filter((member) => member.metricValue > 0)
    .sort(
      (a, b) =>
        b.metricValue - a.metricValue ||
        b.secondaryValue - a.secondaryValue ||
        a.full_name.localeCompare(b.full_name)
    )
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Programs</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#3DCF8E]">
            {dashboard.summary.active_programs}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Learners</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {dashboard.summary.active_learners}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logged Effort</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {dashboard.summary.total_logged_effort.toFixed(1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avg. Streak</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {dashboard.summary.average_current_streak}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityConfig} className="h-[280px] w-full">
              <LineChart data={dashboard.activity_trend}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="effort"
                  stroke="var(--color-effort)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Log Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={frequencyConfig} className="h-[280px] w-full">
              <BarChart data={dashboard.log_frequency}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="logs" fill="var(--color-logs)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Leaderboard View</h3>
            <p className="text-sm text-muted-foreground">
              Compare team effort output and logging consistency by timeframe.
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-[#F8F9FA] p-1 dark:bg-[#11181C]">
            <Button
              type="button"
              variant={leaderboardWindow === 'overall' ? 'default' : 'ghost'}
              className={
                leaderboardWindow === 'overall'
                  ? 'bg-[#3DCF8E] text-white hover:bg-[#2fb577]'
                  : 'text-muted-foreground hover:text-foreground'
              }
              onClick={() => setLeaderboardWindow('overall')}
            >
              Overall
            </Button>
            <Button
              type="button"
              variant={leaderboardWindow === 'past_7_days' ? 'default' : 'ghost'}
              className={
                leaderboardWindow === 'past_7_days'
                  ? 'bg-[#3DCF8E] text-white hover:bg-[#2fb577]'
                  : 'text-muted-foreground hover:text-foreground'
              }
              onClick={() => setLeaderboardWindow('past_7_days')}
            >
              Past 7 Days
            </Button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-[#3DCF8E]/20">
            <CardHeader>
              <CardTitle className="text-base">Highest Effort Logged</CardTitle>
              <CardDescription>
                Top 10 developers by total effort delivered in the selected window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {effortLeaderboard.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No effort logs found for this timeframe.
                </div>
              )}

              {effortLeaderboard.map((member, index) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3DCF8E]/12 text-sm font-semibold text-[#3DCF8E]">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{member.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {member.email || 'No email available'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Latest activity {formatActivityDate(member.latest_activity_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-[#3DCF8E]">
                      {formatMetricValue(member.metricValue, 'effort')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {leaderboardWindow === 'overall'
                        ? `${member.total_logs} logs total`
                        : `${member.total_logs_last_7_days} logs in 7d`}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Most Consistent Loggers</CardTitle>
              <CardDescription>
                Top 10 developers by logging frequency in the selected window.
              </CardDescription>
              <CardAction className="text-xs text-muted-foreground">
                {leaderboardWindow === 'overall' ? 'All-time logs' : 'Recent cadence'}
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {consistencyLeaderboard.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No logging activity found for this timeframe.
                </div>
              )}

              {consistencyLeaderboard.map((member, index) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    #{index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{member.full_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Current streak {member.overall_current_streak} days
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {formatMetricValue(member.metricValue, 'logs')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {leaderboardWindow === 'overall'
                        ? `${member.total_logged_effort.toFixed(1)} effort logged`
                        : `${member.total_logged_effort_last_7_days.toFixed(1)} effort in 7d`}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.member_snapshots.length === 0 && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No team members have active up skill data yet.
            </div>
          )}

          {dashboard.member_snapshots.map((member) => (
            <div
              key={member.user_id}
              className="rounded-2xl border border-border/60 bg-card p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-lg font-semibold">{member.full_name}</h4>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Latest activity:{' '}
                    {member.latest_activity_date
                      ? new Date(member.latest_activity_date).toLocaleDateString()
                      : 'No activity yet'}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Active Programs</div>
                    <div className="text-lg font-semibold">{member.active_programs}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Current Streak</div>
                    <div className="text-lg font-semibold">
                      {member.overall_current_streak}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <div className="text-muted-foreground">Logged Effort</div>
                    <div className="text-lg font-semibold">
                      {member.total_logged_effort.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {member.active_program_details.length > 0 && (
                <div className="mt-4 grid gap-3">
                  {member.active_program_details.map((program) => (
                    <button
                      key={program.program_id}
                      type="button"
                      onClick={() => handleProgramSelect(program.program_id)}
                      className="w-full rounded-xl border border-border/50 bg-muted/35 p-4 text-left transition-colors hover:border-[#3DCF8E]/40 hover:bg-muted/50"
                    >
                      {(() => {
                        const growthTone = getGrowthTone(program.effort_growth_percentage);
                        const GrowthIcon = growthTone.icon;

                        return (
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{program.title}</div>
                            <ProgramStatusBadge status={program.status} />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Last activity:{' '}
                            {program.last_activity_date
                              ? new Date(program.last_activity_date).toLocaleDateString()
                              : 'Not started'}
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 xl:items-end">
                          <div
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${growthTone.className}`}
                          >
                            <GrowthIcon className="h-3.5 w-3.5" />
                            {growthTone.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Effort trend vs previous 7 days
                          </div>
                        </div>
                      </div>
                        );
                      })()}

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                          <div className="text-xs text-muted-foreground">7d Effort</div>
                          <div className="font-semibold text-[#3DCF8E]">
                            {program.logged_effort_last_7_days.toFixed(1)}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Prev 7d {program.logged_effort_previous_7_days.toFixed(1)}
                          </div>
                        </div>
                        <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                          <div className="text-xs text-muted-foreground">Effort Logs</div>
                          <div className="font-semibold">{program.logs_last_7_days}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            Prev 7d {program.logs_previous_7_days}
                          </div>
                        </div>
                        <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                          <div className="text-xs text-muted-foreground">Modules</div>
                          <div className="font-semibold">
                            {program.completed_modules}/{program.total_modules}
                          </div>
                        </div>
                        <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                          <div className="text-xs text-muted-foreground">Streak</div>
                          <div className="font-semibold">{program.current_streak}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Effort completion</span>
                            <span>{program.effort_completion_percentage}%</span>
                          </div>
                          <Progress value={program.effort_completion_percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            Logged {program.completed_effort.toFixed(1)} of{' '}
                            {program.estimated_effort.toFixed(1)} estimated effort
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Module completion</span>
                            <span>{program.completion_percentage}%</span>
                          </div>
                          <Progress value={program.completion_percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {program.completed_modules} of {program.total_modules} modules complete
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-background/80 px-3 py-1">
                          Total logs {program.total_logs}
                        </span>
                        <span className="rounded-full bg-background/80 px-3 py-1">
                          Active days {program.active_days}
                        </span>
                        <span className="rounded-full bg-background/80 px-3 py-1">
                          Logged effort {program.total_logged_effort.toFixed(1)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <TeamProgramDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={(open) => {
          setDetailDrawerOpen(open);
          if (!open) {
            setSelectedProgramId(null);
          }
        }}
        programId={selectedProgramId}
      />
    </div>
  );
};
