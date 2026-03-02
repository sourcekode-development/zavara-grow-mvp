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
import { Eye } from 'lucide-react';
import type { KpiMetricSubmissionWithDetails } from '../types';

interface ClaimsTableProps {
  submissions: KpiMetricSubmissionWithDetails[];
  onViewSubmission: (submission: KpiMetricSubmissionWithDetails) => void;
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

export const ClaimsTable = ({
  submissions,
  onViewSubmission,
}: ClaimsTableProps) => {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No claims found.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Developer</TableHead>
            <TableHead>Metric</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Points Claimed</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">
                {submission.metric?.developer_kpi?.developer?.full_name || 'N/A'}
              </TableCell>
              <TableCell>{submission.metric?.name || 'N/A'}</TableCell>
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
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewSubmission(submission)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
