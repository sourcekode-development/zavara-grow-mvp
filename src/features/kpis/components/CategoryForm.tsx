import { useForm } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { Switch } from '@/components/ui/switch';
import type { CategoryFormData } from '../types';
import type { KpiCategory } from '../types';

interface CategoryFormProps {
  category?: KpiCategory;
  onSubmit: (data: CategoryFormData) => void;
  isLoading?: boolean;
}

export const CategoryForm = ({ category, onSubmit, isLoading }: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    // watch,
    // setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
    },
  });

  // const isGlobal = watch('is_global');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Field>
        <FieldLabel htmlFor="name">Category Name *</FieldLabel>
        <Input
          id="name"
          placeholder="e.g., Technical Excellence"
          {...register('name', {
            required: 'Category name is required',
            maxLength: {
              value: 100,
              message: 'Name must be less than 100 characters',
            },
          })}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          placeholder="What does this category measure?"
          rows={4}
          {...register('description')}
          disabled={isLoading}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Provide context on what metrics belong in this category
        </p>
      </Field>

      {/* <Field>
        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <FieldLabel htmlFor="is_global">Global Category</FieldLabel>
            <p className="text-xs text-muted-foreground mt-1">
              Make this available to all companies (requires admin permission)
            </p>
          </div>
          <Switch
            id="is_global"
            checked={isGlobal}
            onCheckedChange={(checked) => setValue('is_global', checked)}
            disabled={isLoading || !!category}
          />
        </div>
      </Field> */}
    </form>
  );
};
