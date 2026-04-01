import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { ClaimAuditLog } from '../types';

interface ClaimAuditTimelineProps {
  logs: ClaimAuditLog[];
}

export const ClaimAuditTimeline = ({ logs }: ClaimAuditTimelineProps) => {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        No audit activity yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{log.action.toLowerCase()}</Badge>
            <span className="text-sm font-medium">
              {log.actor?.full_name || 'Unknown user'}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
            </span>
          </div>
          {log.comment_text ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {log.comment_text}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
};
