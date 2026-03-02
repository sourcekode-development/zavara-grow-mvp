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
import { Eye, ExternalLink } from 'lucide-react';
import type { KpiMetricSubmissionWithDetails } from '../types';

interface MySubmissionsTableProps {
  submissions: KpiMetricSubmissionWithDetails[];
  onViewSubmission?: (submission: KpiMetricSubmissionWithDetails) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 dark:bg-yellow-600';
    case 'APPROVED':
      return 'bg-[#3DCF8E] dark:bg-[#3DCF8E]';
    case 'REJECTED':
      return 'bg-red-500 dark:bg-red-600';
    default:
      return 'bg-gray-500';
  }
};

export const MySubmissionsTable = ({
  submissions,
  onViewSubmission,
}: MySubmissionsTableProps) => {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No submissions yet. Start by submitting a claim for your active KPI metrics.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Evidence</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">
                {submission.metric?.name || 'N/A'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {submission.metric?.category?.name || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-[#3DCF8E]">
                  {submission.points_awarded || 0} pts
                </span>
              </TableCell>
              <TableCell>
                {new Date(submission.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(submission.status)}>
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell>
                {submission.attachments && submission.attachments.length > 0 ? (
                  <a
                    href={submission.attachments[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3DCF8E] hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {onViewSubmission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewSubmission(submission)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
