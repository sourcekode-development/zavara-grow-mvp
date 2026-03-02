import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Clock, Pencil, Trash2, Target, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CheckpointFormDialog } from './checkpoint-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import type { Checkpoint, CheckpointStatus, CreateCheckpointRequest } from '../types';

interface CheckpointsEditorProps {
  checkpoints: Checkpoint[];
  goalId: string;
  milestones?: Array<{ id: string; title: string }>;
  onAddCheckpoint: (data: CreateCheckpointRequest) => Promise<void>;
  onUpdateCheckpoint?: (checkpointId: string, data: CreateCheckpointRequest) => Promise<void>;
  onDeleteCheckpoint: (checkpointId: string) => Promise<void>;
  isLoading?: boolean;
  canEdit?: boolean;
}

export const CheckpointsEditor = ({
  checkpoints,
  goalId,
  milestones = [],
  onAddCheckpoint,
  onUpdateCheckpoint,
  onDeleteCheckpoint,
  isLoading = false,
  canEdit = true,
}: CheckpointsEditorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [checkpointToDelete, setCheckpointToDelete] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingCheckpoint(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (checkpoint: Checkpoint) => {
    setEditingCheckpoint(checkpoint);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (checkpointId: string) => {
    setCheckpointToDelete(checkpointId);
    setDeleteConfirmOpen(true);
  };

  const handleSaveCheckpoint = async (data: CreateCheckpointRequest) => {
    if (editingCheckpoint && onUpdateCheckpoint) {
      await onUpdateCheckpoint(editingCheckpoint.id, data);
    } else {
      await onAddCheckpoint(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (checkpointToDelete) {
      await onDeleteCheckpoint(checkpointToDelete);
      setCheckpointToDelete(null);
    }
  };

  const statusConfig: Record<CheckpointStatus, { label: string; color: string }> = {
    PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
    READY_FOR_REVIEW: {
      label: 'Ready',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    REVIEW_IN_PROGRESS: {
      label: 'In Review',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    NEEDS_ATTENTION: {
      label: 'Needs Attention',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    PASSED: { label: 'Passed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    SKIPPED: { label: 'Skipped', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const getTriggerDescription = (checkpoint: Checkpoint) => {
    if (checkpoint.trigger_type === 'AFTER_DAYS' && checkpoint.trigger_config?.after_days) {
      return `After ${checkpoint.trigger_config.after_days} days from start`;
    }
    if (checkpoint.trigger_type === 'AFTER_MILESTONE' && checkpoint.milestone_id) {
      const milestone = milestones.find((m) => m.id === checkpoint.milestone_id);
      return milestone ? `After milestone: ${milestone.title}` : 'After milestone completion';
    }
    return 'Manual trigger';
  };

  const canEditCheckpoint = (checkpoint: Checkpoint) => {
    return canEdit && (checkpoint.status === 'PENDING' || checkpoint.status === 'READY_FOR_REVIEW');
  };

  const canDeleteCheckpoint = (checkpoint: Checkpoint) => {
    return canEdit && checkpoint.status === 'PENDING';
  };

  const sortedCheckpoints = [...checkpoints].sort((a, b) => {
    // Sort by scheduled date, then by creation date
    if (a.scheduled_date && b.scheduled_date) {
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    }
    if (a.scheduled_date) return -1;
    if (b.scheduled_date) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Checkpoints</h3>
          <p className="text-sm text-muted-foreground">
            {checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={handleAddClick}
            disabled={isLoading}
            className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Checkpoint
          </Button>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center mb-4">
              No checkpoints configured yet. Add checkpoints to track and validate progress at key milestones.
            </p>
            {canEdit && (
              <Button onClick={handleAddClick} className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add First Checkpoint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedCheckpoints.map((checkpoint) => {
            const config = statusConfig[checkpoint.status];

            return (
              <Card key={checkpoint.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {checkpoint.title}
                        <Badge className={config.color}>{config.label}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTriggerDescription(checkpoint)}
                        </span>
                        {checkpoint.type === 'AI_INTERVIEW' && (
                          <Badge variant="outline" className="text-xs">
                            AI Interview
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canEditCheckpoint(checkpoint) && onUpdateCheckpoint && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(checkpoint)}
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteCheckpoint(checkpoint) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(checkpoint.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {checkpoint.description && (
                    <p className="text-sm text-muted-foreground mb-3">{checkpoint.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {checkpoint.scheduled_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Scheduled: {format(new Date(checkpoint.scheduled_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {checkpoint.assigned_reviewer_id && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Reviewer assigned</span>
                      </div>
                    )}
                  </div>
                  {checkpoint.developer_notes && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-xs font-medium mb-1">Developer Notes:</p>
                      <p className="text-sm">{checkpoint.developer_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Checkpoint Form Dialog */}
      <CheckpointFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveCheckpoint}
        checkpoint={editingCheckpoint}
        goalId={goalId}
        milestones={milestones}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Checkpoint"
        description="Are you sure you want to delete this checkpoint? This action cannot be undone."
        actionLabel="Delete"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
};
