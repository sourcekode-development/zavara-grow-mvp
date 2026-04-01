import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { AssignKpiRequest, KpiReviewer, KpiTemplate } from '../types';

interface KpiAssignmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  developerId: string;
  developerName: string;
  templates: KpiTemplate[];
  reviewers: KpiReviewer[];
  onSubmit: (request: AssignKpiRequest) => Promise<void>;
}

export const KpiAssignmentDrawer = ({
  open,
  onOpenChange,
  developerId,
  developerName,
  templates,
  reviewers,
  onSubmit,
}: KpiAssignmentDrawerProps) => {
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reviewerIds, setReviewerIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTemplateId(templates[0]?.id || '');
    setStartDate('');
    setEndDate('');
    setReviewerIds([]);
    setError(null);
  }, [open, templates]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) || null,
    [templateId, templates]
  );

  const dimensionTotal = selectedTemplate?.dimensions?.reduce(
    (sum, item) => sum + Number(item.weight_percentage),
    0
  ) || 0;
  const metricTotal = selectedTemplate?.metrics?.reduce(
    (sum, item) => sum + Number(item.max_points),
    0
  ) || 0;

  const handleSubmit = async () => {
    if (!templateId || !startDate || !endDate) {
      setError('Template, start date, and end date are required');
      return;
    }

    if (reviewerIds.length === 0) {
      setError('Select at least one reviewer');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        developer_id: developerId,
        template_id: templateId,
        start_date: startDate,
        end_date: endDate,
        reviewer_ids: reviewerIds,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to assign KPI'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">Assign KPI</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Create a new active KPI snapshot for {developerName}.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="assignment-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="assignment-template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-start-date">Start Date</Label>
              <Input
                id="assignment-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-end-date">End Date</Label>
              <Input
                id="assignment-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-semibold">Reviewers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Only users from your company are available here.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {reviewers.map((reviewer) => (
                <label
                  key={reviewer.reviewer_id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={reviewerIds.includes(reviewer.reviewer_id)}
                    onCheckedChange={(checked) =>
                      setReviewerIds((current) =>
                        checked
                          ? [...current, reviewer.reviewer_id]
                          : current.filter((item) => item !== reviewer.reviewer_id)
                      )
                    }
                  />
                  <div>
                    <div className="font-medium">{reviewer.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {reviewer.email || 'No email'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedTemplate ? (
            <div className="rounded-xl border bg-muted/20 p-4">
              <h3 className="font-semibold">Assignment Validation</h3>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Dimension weight total</span>
                  <span className="font-semibold">{dimensionTotal}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Standard metric point total</span>
                  <span className="font-semibold">{metricTotal}</span>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </div>

        <DrawerFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-[#3DCF8E] text-white hover:bg-[#2fb577]"
            >
              {isSubmitting ? 'Assigning...' : 'Assign KPI'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
