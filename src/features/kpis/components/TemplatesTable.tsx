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
import { Spinner } from '@/components/ui/spinner';
import { Pencil, Trash2, Globe, Building2, Eye } from 'lucide-react';
import type { KpiTemplateWithMetrics, KpiCycleType } from '../types';

interface TemplatesTableProps {
  templates: KpiTemplateWithMetrics[];
  isLoading: boolean;
  onView?: (template: KpiTemplateWithMetrics) => void;
  onEdit?: (template: KpiTemplateWithMetrics) => void;
  onDelete?: (template: KpiTemplateWithMetrics) => void;
}

const getCycleTypeBadge = (cycleType: KpiCycleType) => {
  const badges = {
    QUARTERLY: { label: 'Quarterly', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
    HALF_YEARLY: { label: 'Half-Yearly', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
    ANNUAL: { label: 'Annual', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    CUSTOM: { label: 'Custom', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
  };

  const badge = badges[cycleType] || badges.CUSTOM;
  return <Badge variant="outline" className={badge.color}>{badge.label}</Badge>;
};

export const TemplatesTable = ({
  templates,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: TemplatesTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No templates yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first KPI template with metrics to start evaluating performance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Cycle</TableHead>
            <TableHead>Metrics</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((template) => {
            const metricsCount = template.metrics?.length || 0;
            const totalPoints = template.metrics?.reduce((sum, m) => sum + m.target_points, 0) || 0;
            const targetPoints = template.total_target_points;
            const percentage = targetPoints > 0 ? (totalPoints / targetPoints) * 100 : 0;

            return (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.title}</TableCell>
                <TableCell>{getCycleTypeBadge(template.cycle_type)}</TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{metricsCount} metrics</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="w-16 h-2" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {totalPoints}/{targetPoints}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {template.company_id === null ? (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    >
                      <Globe className="h-3 w-3 mr-1" />
                      Global
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      Company
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(template)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(template)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
