import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import type { UpskillProgramDashboardData } from '../types';

const effortChartConfig = {
  effort: {
    label: 'Effort',
    color: '#3DCF8E',
  },
};

const logChartConfig = {
  logs: {
    label: 'Logs',
    color: '#3DCF8E',
  },
};

export const ProgramDashboard = ({
  dashboard,
}: {
  dashboard: UpskillProgramDashboardData | null;
}) => {
  if (!dashboard) {
    return null;
  }

  const { summary } = dashboard;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logged Effort</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#3DCF8E]">
            {summary.total_logged_effort.toFixed(1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimated Effort</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.estimated_effort.toFixed(1)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Streak</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.current_streak}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Module Completion</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {summary.module_completion_percentage}%
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Effort Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={effortChartConfig} className="h-[280px] w-full">
              <LineChart data={dashboard.effort_trend}>
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
            <ChartContainer config={logChartConfig} className="h-[280px] w-full">
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
    </div>
  );
};
