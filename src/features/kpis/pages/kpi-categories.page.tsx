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
import { CategoryForm } from '../components/CategoryForm';
import { CategoriesTable } from '../components/CategoriesTable';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories';
import type { KpiCategory, CategoryFormData } from '../types';

export const KpiCategoriesPage = () => {
  const { categories, isLoading, filters, updateFilters } = useCategories();
  const { createCategory } = useCreateCategory();
  const { updateCategory } = useUpdateCategory();
  const { deleteCategory } = useDeleteCategory();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KpiCategory | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<KpiCategory | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClick = () => {
    setEditingCategory(undefined);
    setDrawerOpen(true);
  };

  const handleEditClick = (category: KpiCategory) => {
    setEditingCategory(category);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (category: KpiCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category
        const result = await updateCategory(editingCategory.id, {
          name: data.name,
          description: data.description,
        });

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Category updated successfully');
          setDrawerOpen(false);
        }
      } else {
        // Create new category
        const result = await createCategory(data);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Category created successfully');
          setDrawerOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    const result = await deleteCategory(categoryToDelete.id);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setCategoryToDelete(undefined);
    }
  };

  const handleSaveClick = () => {
    // Trigger form submission
    const form = document.querySelector('form') as HTMLFormElement;
    form?.requestSubmit();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI Categories</h1>
          <p className="text-muted-foreground">
            Organize metrics into categories like Technical, Soft Skills, etc.
          </p>
        </div>
        <Button onClick={handleCreateClick} className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
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
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="company">Company Only</SelectItem>
            <SelectItem value="global">Global Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <CategoriesTable
        categories={categories}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Create/Edit Drawer */}
      <KpiDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        description={
          editingCategory
            ? 'Update the category details'
            : 'Add a new category to organize your KPI metrics'
        }
        onSave={handleSaveClick}
        isLoading={isSubmitting}
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </KpiDrawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be
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
