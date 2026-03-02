import { Badge } from '@/components/ui/badge';
import type { GoalStatus } from '../types';

interface GoalStatusBadgeProps {
  status: GoalStatus;
  className?: string;
}

const statusConfig: Record<GoalStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
  },
  PENDING_REVIEW: {
    label: 'Pending Review',
    className: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/30'
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    className: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30'
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-[#3DCF8E]/10 dark:bg-[#3DCF8E]/20 text-[#3DCF8E] hover:bg-[#3DCF8E]/20 dark:hover:bg-[#3DCF8E]/30'
  },
  ON_HOLD: {
    label: 'On Hold',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
  },
  BLOCKED: {
    label: 'Blocked',
    className: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
  },
  ABANDONED: {
    label: 'Abandoned',
    className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
  },
};

export const GoalStatusBadge = ({ status, className }: GoalStatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge variant="secondary" className={`${config.className} ${className || ''}`}>
      {config.label}
    </Badge>
  );
};
