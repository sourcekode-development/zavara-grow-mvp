import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateUpskillProgramRequest,
  UpdateUpskillProgramRequest,
  UpskillTemplateWithModules,
} from '../types';

interface ProgramFormProps {
  initialValues?: {
    title?: string;
    description?: string | null;
    total_effort?: number | null;
    template_id?: string | null;
  };
  templates?: UpskillTemplateWithModules[];
  submitLabel: string;
  isSubmitting?: boolean;
  showTemplatePicker?: boolean;
  onSubmit: (
    data: CreateUpskillProgramRequest | UpdateUpskillProgramRequest
  ) => Promise<void>;
}

export const ProgramForm = ({
  initialValues,
  templates = [],
  submitLabel,
  isSubmitting = false,
  showTemplatePicker = false,
  onSubmit,
}: ProgramFormProps) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [totalEffort, setTotalEffort] = useState(
    initialValues?.total_effort?.toString() || ''
  );
  const [templateId, setTemplateId] = useState(initialValues?.template_id || 'none');

  const canSubmit = useMemo(() => title.trim().length > 0, [title]);

  const handleSubmit = async () => {
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      total_effort: totalEffort.trim() ? Number(totalEffort) : null,
      ...(showTemplatePicker && templateId !== 'none'
        ? { template_id: templateId }
        : {}),
    });
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="upskill-program-title">
            Program Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="upskill-program-title"
            placeholder="e.g. Become deployment-ready with AWS and Docker"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upskill-program-description">Description</Label>
          <Textarea
            id="upskill-program-description"
            rows={4}
            placeholder="What outcome are you aiming for with this program?"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="upskill-program-effort">Estimated Total Effort</Label>
          <Input
            id="upskill-program-effort"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 24"
            value={totalEffort}
            onChange={(event) => setTotalEffort(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This is an estimate and can be updated later.
          </p>
        </div>

        {showTemplatePicker && (
          <div className="space-y-2">
            <Label htmlFor="upskill-program-template">Start From Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="upskill-program-template">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Start from scratch</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            className="bg-[#3DCF8E] hover:bg-[#2fb577]"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

