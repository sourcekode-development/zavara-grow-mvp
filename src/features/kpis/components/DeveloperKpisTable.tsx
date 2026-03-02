import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreVertical, Archive, CheckCircle } from 'lucide-react';
import type { DeveloperKpiWithMetrics } from '../types';

interface DeveloperKpisTableProps {
  developerKpis: DeveloperKpiWithMetrics[];
  onViewKpi: (kpi: DeveloperKpiWithMetrics) => void;
  onStatusUpdate: (id: string, status: 'COMPLETED' | 'ARCHIVED') => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[#3DCF8E] dark:bg-[#3DCF8E]';
    case 'COMPLETED':
      return 'bg-blue-500 dark:bg-blue-600';
    case 'ARCHIVED':
      return 'bg-gray-500 dark:bg-gray-600';
    default:
      return 'bg-gray-500';
  }
};

const calculateProgress = (kpi: DeveloperKpiWithMetrics): number => {
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

export const DeveloperKpisTable = ({
  developerKpis,
  onViewKpi,
  onStatusUpdate,
}: DeveloperKpisTableProps) => {
  if (developerKpis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No developer KPIs found. Click "Assign KPI" to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Developer</TableHead>
            <TableHead>KPI Name</TableHead>
            <TableHead>Cycle</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {developerKpis.map((kpi) => {
            const progress = calculateProgress(kpi);

            return (
              <TableRow key={kpi.id}>
                <TableCell className="font-medium">
                  {kpi.developer?.full_name || 'N/A'}
                </TableCell>
                <TableCell>{kpi.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">KPI</Badge>
                </TableCell>
                <TableCell>
                  {kpi.start_date
                    ? new Date(kpi.start_date).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {kpi.end_date
                    ? new Date(kpi.end_date).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="w-24" />
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(kpi.status)}>
                    {kpi.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewKpi(kpi)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {kpi.status === 'ACTIVE' && (
                        <DropdownMenuItem
                          onClick={() => onStatusUpdate(kpi.id, 'COMPLETED')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Completed
                        </DropdownMenuItem>
                      )}
                      {kpi.status !== 'ARCHIVED' && (
                        <DropdownMenuItem
                          onClick={() => onStatusUpdate(kpi.id, 'ARCHIVED')}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
