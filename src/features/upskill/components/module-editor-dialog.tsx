import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateUpskillModuleRequest,
  UpdateUpskillModuleRequest,
  UpskillProgramModuleWithMetrics,
} from '../types';

interface ModuleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  module?: UpskillProgramModuleWithMetrics | null;
  onSave: (
    data: CreateUpskillModuleRequest | UpdateUpskillModuleRequest
  ) => Promise<void>;
}

export const ModuleEditorDialog = ({
  open,
  onOpenChange,
  programId,
  module,
  onSave,
}: ModuleEditorDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [effort, setEffort] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'WONT_DO'>(
    'TODO'
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description || '');
      setEffort(module.effort?.toString() || '');
      setContent(module.content?.text || '');
      setStatus(module.status);
    } else {
      setTitle('');
      setDescription('');
      setEffort('');
      setContent('');
      setStatus('TODO');
    }
  }, [module, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(
        module
          ? {
              title: title.trim(),
              description: description.trim() || null,
              effort: effort.trim() ? Number(effort) : null,
              status,
              content: content.trim()
                ? {
                    type: 'plain_text',
                    text: content.trim(),
                  }
                : null,
            }
          : {
              program_id: programId,
              title: title.trim(),
              description: description.trim() || undefined,
              effort: effort.trim() ? Number(effort) : null,
              content: content.trim()
                ? {
                    type: 'plain_text',
                    text: content.trim(),
                  }
                : null,
            }
      );
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Module' : 'Add Module'}</DialogTitle>
          <DialogDescription>
            Modules can be refined anytime before the program is completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="upskill-module-title">Title</Label>
            <Input
              id="upskill-module-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Docker fundamentals"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-module-description">Description</Label>
            <Textarea
              id="upskill-module-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should be covered in this module?"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upskill-module-effort">Estimated Effort</Label>
              <Input
                id="upskill-module-effort"
                type="number"
                min="0.1"
                step="0.1"
                value={effort}
                onChange={(event) => setEffort(event.target.value)}
                placeholder="e.g. 4"
              />
            </div>

            {module && (
              <div className="space-y-2">
                <Label htmlFor="upskill-module-status">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger id="upskill-module-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">TODO</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="WONT_DO">Won&apos;t Do</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-module-content">Content</Label>
            <Textarea
              id="upskill-module-content"
              rows={7}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Paste links to videos, courses, blogs, or write your own notes here."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : module ? 'Update Module' : 'Add Module'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

