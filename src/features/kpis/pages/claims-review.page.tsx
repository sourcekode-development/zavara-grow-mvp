import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ClaimsTable } from '../components/ClaimsTable';
import { ReviewClaimDrawer } from '../components/ReviewClaimDrawer';
import { useSubmissions } from '../hooks/useSubmissions';
import type { KpiMetricSubmissionWithDetails } from '../types';

export const ClaimsReviewPage = () => {
  const { submissions, isLoading, filters, updateFilters, refetch } =
    useSubmissions();

  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<KpiMetricSubmissionWithDetails | null>(null);

  const handleViewSubmission = (submission: KpiMetricSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setReviewDrawerOpen(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  // Count submissions by status
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const approvedCount = submissions.filter((s) => s.status === 'APPROVED').length;
  const rejectedCount = submissions.filter((s) => s.status === 'REJECTED').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Claims Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve developer KPI submissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-yellow-500">
                {pendingCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-3xl font-bold text-[#3DCF8E]">
                {approvedCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-3xl font-bold text-red-500">{rejectedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading claims...
        </div>
      ) : (
        <ClaimsTable
          submissions={submissions}
          onViewSubmission={handleViewSubmission}
        />
      )}

      {/* Review Drawer */}
      <ReviewClaimDrawer
        open={reviewDrawerOpen}
        onOpenChange={setReviewDrawerOpen}
        submission={selectedSubmission}
        onSuccess={refetch}
      />
    </div>
  );
};
