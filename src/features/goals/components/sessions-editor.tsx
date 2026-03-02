import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { SessionFormDialog } from './session-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import type { CadenceSession, CadenceSessionStatus } from '../types';

interface SessionsEditorProps {
  sessions: CadenceSession[];
  goalId: string;
  milestones?: Array<{ id: string; title: string }>;
  onAddSession: (sessionData: Partial<CadenceSession>) => Promise<void>;
  onUpdateSession: (sessionId: string, sessionData: Partial<CadenceSession>) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  isLoading?: boolean;
}

export const SessionsEditor = ({
  sessions,
  goalId,
  milestones,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
  isLoading = false,
}: SessionsEditorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<CadenceSession | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (session: CadenceSession) => {
    setEditingSession(session);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteConfirmOpen(true);
  };

  const handleSaveSession = async (sessionData: Partial<CadenceSession>) => {
    if (editingSession) {
      await onUpdateSession(editingSession.id, sessionData);
    } else {
      await onAddSession(sessionData);
    }
  };

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const statusConfig: Record<CadenceSessionStatus, { label: string; color: string }> = {
    TO_DO: { label: 'To Do', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-[#3DCF8E]/20 text-[#3DCF8E]' },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    DUE: { label: 'Due', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    MISSED: { label: 'Missed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    SKIPPED: { label: 'Skipped', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (!a.scheduled_date) return 1;
    if (!b.scheduled_date) return -1;
    return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cadence Sessions</h3>
          <p className="text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <Button
          onClick={handleAddClick}
          disabled={isLoading}
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center mb-4">
              No sessions scheduled yet. Add your first cadence session to get started.
            </p>
            <Button
              onClick={handleAddClick}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => {
            const config = statusConfig[session.status];
            const milestone = milestones?.find((m) => m.id === session.milestone_id);

            return (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {session.title || 'Untitled Session'}
                        <Badge className={config.color}>{config.label}</Badge>
                      </CardTitle>
                      {milestone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Milestone: {milestone.title}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(session)}
                        disabled={isLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(session.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {session.scheduled_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(session.scheduled_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{session.duration_minutes} min</span>
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-1">Notes:</p>
                      <p className="text-sm">{session.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session Form Dialog */}
      <SessionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveSession}
        session={editingSession}
        goalId={goalId}
        milestones={milestones}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        actionLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};
