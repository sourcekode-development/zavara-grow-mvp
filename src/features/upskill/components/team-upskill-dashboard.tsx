import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { TeamUpskillDashboardData } from '../types';
import { ProgramStatusBadge } from './program-status-badge';

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

export const TeamUpskillDashboard = ({
  dashboard,
}: {
  dashboard: TeamUpskillDashboardData | null;
}) => {
  if (!dashboard) {
    return null;
  }

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
                    <div
                      key={program.program_id}
                      className="rounded-xl border border-border/50 bg-muted/35 p-4"
                    >
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

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">Effort</div>
                            <div className="font-semibold">
                              {program.completed_effort.toFixed(1)}/{program.estimated_effort.toFixed(1)}
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
                          <div className="rounded-lg bg-background/80 px-3 py-2 text-sm">
                            <div className="text-xs text-muted-foreground">7d Logs</div>
                            <div className="font-semibold">{program.logs_last_7_days}</div>
                          </div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
