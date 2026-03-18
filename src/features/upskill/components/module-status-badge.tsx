import { Badge } from '@/components/ui/badge';
import type { UpskillModuleStatus } from '@/shared/types';

const statusStyles: Record<UpskillModuleStatus, string> = {
  TODO: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  IN_PROGRESS:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED:
    'bg-[#3DCF8E]/15 text-[#2f9f68] dark:bg-[#3DCF8E]/20 dark:text-[#79e6b2]',
  WONT_DO: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export const ModuleStatusBadge = ({ status }: { status: UpskillModuleStatus }) => (
  <Badge className={statusStyles[status]}>{status.replace('_', ' ')}</Badge>
);

