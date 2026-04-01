import { Badge } from '@/components/ui/badge';
import type { ClaimStatus } from '../types';

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
}

const classesByStatus: Record<ClaimStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  APPROVED: 'bg-[#3DCF8E]/15 text-[#208d61] dark:text-[#3DCF8E]',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
};

export const ClaimStatusBadge = ({ status }: ClaimStatusBadgeProps) => (
  <Badge className={classesByStatus[status]}>{status.toLowerCase()}</Badge>
);
