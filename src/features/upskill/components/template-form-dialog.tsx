import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateUpskillTemplateRequest,
  UpskillTemplateWithModules,
} from '../types';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate?: UpskillTemplateWithModules | null;
  onSubmit: (request: CreateUpskillTemplateRequest) => Promise<void>;
}

export const TemplateFormDialog = ({
  open,
  onOpenChange,
  initialTemplate,
  onSubmit,
}: TemplateFormDialogProps) => {
  const createModuleDraft = (module?: {
    title?: string;
    description?: string | null;
    effort?: string | number | null;
    content?: string | null;
  }) => ({
    localId: crypto.randomUUID(),
    title: module?.title || '',
    description: module?.description || '',
    effort:
      typeof module?.effort === 'number'
        ? module.effort.toString()
        : module?.effort || '',
    content: module?.content || '',
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalEffort, setTotalEffort] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [modules, setModules] = useState<
    Array<{
      localId: string;
      title: string;
      description: string;
      effort: string;
      content: string;
    }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTemplate) {
      setTitle(initialTemplate.title);
      setDescription(initialTemplate.description || '');
      setTotalEffort(initialTemplate.total_effort?.toString() || '');
      setIsActive(initialTemplate.is_active);
      setIsPublished(initialTemplate.is_published);
      setModules(
        (initialTemplate.modules || []).map((module) =>
          createModuleDraft({
            title: module.title,
            description: module.description || '',
            effort: module.effort?.toString() || '',
            content: module.content?.text || '',
          })
        )
      );
    } else {
      setTitle('');
      setDescription('');
      setTotalEffort('');
      setIsActive(true);
      setIsPublished(false);
      setModules([]);
    }
  }, [initialTemplate, open]);

  const updateModule = (
    index: number,
    key: 'title' | 'description' | 'effort' | 'content',
    value: string
  ) => {
    setModules((current) =>
      current.map((module, currentIndex) =>
        currentIndex === index ? { ...module, [key]: value } : module
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        total_effort: totalEffort.trim() ? Number(totalEffort) : null,
        is_active: isActive,
        is_published: isPublished,
        modules: modules
          .filter((module) => module.title.trim())
          .map((module, index) => ({
            title: module.title.trim(),
            description: module.description.trim() || undefined,
            effort: module.effort.trim() ? Number(module.effort) : null,
            order_index: index,
            content: module.content.trim()
              ? {
                  type: 'plain_text',
                  text: module.content.trim(),
                }
              : null,
          })),
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-4xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between">
          <div className="flex-1">
            <DrawerTitle className="text-2xl">
              {initialTemplate ? 'Edit Template' : 'Create Template'}
            </DrawerTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Templates can include modules so developers can duplicate a full program structure.
            </p>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upskill-template-title">Title</Label>
              <Input
                id="upskill-template-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upskill-template-effort">Estimated Total Effort</Label>
              <Input
                id="upskill-template-effort"
                type="number"
                min="0.1"
                step="0.1"
                value={totalEffort}
                onChange={(event) => setTotalEffort(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upskill-template-description">Description</Label>
            <Textarea
              id="upskill-template-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-6 rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <div>
                <div className="font-medium">Active</div>
                <div className="text-xs text-muted-foreground">
                  Show this template in the library.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <div>
                <div className="font-medium">Published</div>
                <div className="text-xs text-muted-foreground">
                  Make this template visible as a reusable company default.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Template Modules</h3>
                <p className="text-sm text-muted-foreground">
                  Keep these lightweight. Developers can still refine modules later.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setModules((current) => [...current, createModuleDraft()])
                }
              >
                Add Module
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((module, index) => (
                <div key={module.localId} className="rounded-xl border border-border/60 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-medium">Module {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setModules((current) =>
                          current.filter(
                            (currentModule) => currentModule.localId !== module.localId
                          )
                        )
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={module.title}
                        onChange={(event) =>
                          updateModule(index, 'title', event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Effort</Label>
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={module.effort}
                        onChange={(event) =>
                          updateModule(index, 'effort', event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={module.description}
                      onChange={(event) =>
                        updateModule(index, 'description', event.target.value)
                      }
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      rows={4}
                      value={module.content}
                      onChange={(event) =>
                        updateModule(index, 'content', event.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter>
          <div className='flex justify-end items-center w-full flex-row gap-4'>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3DCF8E] hover:bg-[#2fb577]"
              onClick={handleSubmit}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
