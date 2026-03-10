import {
  useEffect,
  useState,
} from 'react';
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
import { claimsStorageApi } from '../apis/claims-storage.api';
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
  const [signedScreenshotUrls, setSignedScreenshotUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadSignedUrls = async () => {
      const entries = await Promise.all(
        submissions.map(async (submission): Promise<[string, string]> => {
          const path = submission.screenshot_paths?.[0];
          if (!path) {
            return [submission.id, ''];
          }

          const signedUrl = await claimsStorageApi.getSignedScreenshotUrl(path);
          return [submission.id, signedUrl || ''];
        })
      );

      if (isMounted) {
        setSignedScreenshotUrls(
          Object.fromEntries(entries.filter(([, url]) => Boolean(url)))
        );
      }
    };

    void loadSignedUrls();
    return () => {
      isMounted = false;
    };
  }, [submissions]);

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
          {submissions.map((submission) => {
            const screenshotUrl = signedScreenshotUrls[submission.id] || null;
            const evidenceUrl = screenshotUrl || submission.attachments?.[0] || null;

            return (
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
                {evidenceUrl ? (
                  <a
                    href={evidenceUrl}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
