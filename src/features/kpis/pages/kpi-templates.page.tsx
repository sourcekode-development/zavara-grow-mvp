import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { KpiDrawer } from '../components/KpiDrawer';
import { TemplateForm } from '../components/TemplateForm';
import { TemplatesTable } from '../components/TemplatesTable';
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
} from '../hooks/useTemplates';
import type { KpiTemplateWithMetrics, TemplateFormData, KpiCycleType } from '../types';

export const KpiTemplatesPage = () => {
  const { templates, isLoading, filters, updateFilters } = useTemplates();
  const { createTemplate } = useCreateTemplate();
  const { deleteTemplate } = useDeleteTemplate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<KpiTemplateWithMetrics | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<KpiTemplateWithMetrics | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClick = () => {
    setEditingTemplate(undefined);
    setDrawerOpen(true);
  };

  const handleEditClick = (template: KpiTemplateWithMetrics) => {
    setEditingTemplate(template);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (template: KpiTemplateWithMetrics) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);

    try {
      const result = await createTemplate(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Template created successfully');
        setDrawerOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    const result = await deleteTemplate(templateToDelete.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Template deleted successfully');
      setDeleteDialogOpen(false);
      setTemplateToDelete(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Templates</h1>
          <p className="text-muted-foreground">
            Manage performance review templates and metrics
          </p>
        </div>
        <Button onClick={handleCreateClick} className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.cycle_type || 'all'}
          onValueChange={(value) =>
            updateFilters({
              ...filters,
              cycle_type: value === 'all' ? undefined : (value as KpiCycleType),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cycle Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cycles</SelectItem>
            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
            <SelectItem value="HALF_YEARLY">Half-Yearly</SelectItem>
            <SelectItem value="ANNUAL">Annual</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.company_scope || 'all'}
          onValueChange={(value) =>
            updateFilters({ ...filters, company_scope: value as any })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="company">Company Only</SelectItem>
            <SelectItem value="global">Global Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <TemplatesTable
        templates={templates}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Create/Edit Drawer */}
      <KpiDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingTemplate ? 'Edit Template' : 'Create Template'}
        description={
          editingTemplate
            ? 'Update the template details and metrics'
            : 'Create a new KPI template with weighted metrics'
        }
        size="large"
      >
        <TemplateForm
          template={editingTemplate}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </KpiDrawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{templateToDelete?.title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


