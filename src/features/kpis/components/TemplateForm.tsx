import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
// import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Plus, X, AlertCircle } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import type { TemplateFormData, KpiCycleType, KpiTemplateWithMetrics } from '../types';

interface TemplateFormProps {
  template?: KpiTemplateWithMetrics;
  onSubmit: (data: TemplateFormData) => void;
  isLoading?: boolean;
}

const CYCLE_TYPES: { value: KpiCycleType; label: string }[] = [
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'ANNUAL', label: 'Annual' },
  { value: 'CUSTOM', label: 'Custom' },
];

export const TemplateForm = ({ template, onSubmit, isLoading }: TemplateFormProps) => {
  const { categories } = useCategories();
  const [step, setStep] = useState(1);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    defaultValues: {
      title: template?.title || '',
      cycle_type: template?.cycle_type || 'QUARTERLY',
      total_target_points: template?.total_target_points || 1000,
      metrics: template?.metrics?.map((m) => ({
        category_id: m.category_id,
        name: m.name,
        target_points: m.target_points,
        description: m.description,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'metrics',
  });

  // const isGlobal = watch('is_global');
  const cycleType = watch('cycle_type');
  const totalTargetPoints = watch('total_target_points');
  const metrics = watch('metrics');

  const calculatedTotal = metrics?.reduce((sum, m) => sum + (Number(m.target_points) || 0), 0) || 0;
  const progressPercentage = totalTargetPoints > 0 ? (calculatedTotal / totalTargetPoints) * 100 : 0;
  const isPointsValid = calculatedTotal === totalTargetPoints;

  const addMetric = () => {
    append({
      category_id: '',
      name: '',
      target_points: 0,
      description: '',
    });
  };

  const canGoToStep2 = () => {
    return watch('title')?.trim() && watch('cycle_type');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 1
              ? 'bg-[#3DCF8E] text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          1
        </div>
        <span className={`text-sm ${step === 1 ? 'font-medium' : 'text-muted-foreground'}`}>
          Template Details
        </span>
        <div className="h-px flex-1 bg-border" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
            step === 2
              ? 'bg-[#3DCF8E] text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          2
        </div>
        <span className={`text-sm ${step === 2 ? 'font-medium' : 'text-muted-foreground'}`}>
          Add Metrics
        </span>
      </div>

      {/* Step 1: Template Details */}
      {step === 1 && (
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="title">Template Title *</FieldLabel>
            <Input
              id="title"
              placeholder="e.g., Senior MERN Developer - Q3"
              {...register('title', { required: 'Title is required' })}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="cycle_type">Review Cycle *</FieldLabel>
            <Select
              value={cycleType}
              onValueChange={(value) => setValue('cycle_type', value as KpiCycleType)}
              disabled={isLoading}
            >
              <SelectTrigger id="cycle_type">
                <SelectValue placeholder="Select cycle type" />
              </SelectTrigger>
              <SelectContent>
                {CYCLE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.cycle_type && (
              <p className="text-sm text-red-500 mt-1">{errors.cycle_type.message}</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="total_target_points">Total Target Points</FieldLabel>
            <Input
              id="total_target_points"
              type="number"
              {...register('total_target_points', {
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1' },
              })}
              disabled={isLoading || !!template}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Standard is 1000 points. All metrics must sum to this total.
            </p>
          </Field>

          {/* <Field>
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1">
                <FieldLabel htmlFor="is_global">Global Template</FieldLabel>
                <p className="text-xs text-muted-foreground mt-1">
                  Available to all companies
                </p>
              </div>
              <Switch
                id="is_global"
                checked={isGlobal}
                onCheckedChange={(checked) => setValue('is_global', checked)}
                disabled={isLoading || !!template}
              />
            </div>
          </Field> */}

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canGoToStep2()}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            >
              Next: Add Metrics
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Add Metrics */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Points Progress */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Points Allocation</span>
              <Badge
                variant={isPointsValid ? 'default' : 'destructive'}
                className={isPointsValid ? 'bg-[#3DCF8E]' : ''}
              >
                {calculatedTotal} / {totalTargetPoints}
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            {!isPointsValid && calculatedTotal > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {calculatedTotal < totalTargetPoints
                    ? `${totalTargetPoints - calculatedTotal} points remaining`
                    : `${calculatedTotal - totalTargetPoints} points over limit`}
                </span>
              </div>
            )}
          </div>

          {/* Metrics List */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Metric {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0 text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <Field>
                  <FieldLabel>Category *</FieldLabel>
                  <Select
                    value={metrics[index]?.category_id || ''}
                    onValueChange={(value) =>
                      setValue(`metrics.${index}.category_id`, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Metric Name *</FieldLabel>
                  <Input
                    placeholder="e.g., Code Quality & Bug Rate"
                    {...register(`metrics.${index}.name`, {
                      required: 'Name is required',
                    })}
                  />
                </Field>

                <Field>
                  <FieldLabel>Target Points *</FieldLabel>
                  <Input
                    type="number"
                    placeholder="e.g., 200"
                    {...register(`metrics.${index}.target_points`, {
                      valueAsNumber: true,
                      required: 'Points required',
                      min: { value: 1, message: 'Must be at least 1' },
                    })}
                  />
                </Field>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    placeholder="Guidelines on how to earn these points..."
                    rows={2}
                    {...register(`metrics.${index}.description`)}
                    className="resize-none"
                  />
                </Field>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addMetric}
              className="w-full"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!isPointsValid || fields.length === 0 || isLoading}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            >
              {isLoading ? 'Creating...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
