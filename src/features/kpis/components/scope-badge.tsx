import { Badge } from '@/components/ui/badge';
import type { KpiScope } from '../types';

interface ScopeBadgeProps {
  scope: KpiScope;
}

export const ScopeBadge = ({ scope }: ScopeBadgeProps) => (
  <Badge
    variant={scope === 'PLATFORM' ? 'secondary' : 'outline'}
    className={scope === 'PLATFORM' ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100' : ''}
  >
    {scope === 'PLATFORM' ? 'Platform' : 'Company'}
  </Badge>
);
