import { Badge } from '@/components/ui/badge';
import type { UpskillProgramStatus } from '@/shared/types';

const statusStyles: Record<UpskillProgramStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  PENDING_REVIEW:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  APPROVED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COMPLETED:
    'bg-[#3DCF8E]/15 text-[#2f9f68] dark:bg-[#3DCF8E]/20 dark:text-[#79e6b2]',
};

export const ProgramStatusBadge = ({ status }: { status: UpskillProgramStatus }) => (
  <Badge className={statusStyles[status]}>{status.replace('_', ' ')}</Badge>
);

