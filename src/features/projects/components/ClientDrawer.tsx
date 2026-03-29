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
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import type { ClientWithStats, CreateClientRequest, UpdateClientRequest } from '../types';

interface ClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialClient?: ClientWithStats | null;
  onSubmit: (
    payload: CreateClientRequest | UpdateClientRequest
  ) => Promise<{ success: boolean; error?: string }>;
  companyId: string;
}

export const ClientDrawer = ({
  open,
  onOpenChange,
  initialClient,
  onSubmit,
  companyId,
}: ClientDrawerProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(initialClient?.name || '');
    setDescription(initialClient?.description || '');
    setError(null);
  }, [initialClient, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const response = await onSubmit(
      initialClient
        ? { name: name.trim(), description: description.trim() || null }
        : { company_id: companyId, name: name.trim(), description: description.trim() || undefined }
    );
    setIsSubmitting(false);

    if (response.success) {
      onOpenChange(false);
      return;
    }

    setError(response.error || 'Unable to save client');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="!w-full !max-w-2xl overflow-y-auto p-6">
        <DrawerHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <DrawerTitle className="text-2xl">
              {initialClient ? 'Edit Client' : 'Create Client'}
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Clients group delivery projects for service-based organizations.
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
            <Label htmlFor="client-name">Client Name</Label>
            <Input
              id="client-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Acme Corporation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-description">Description</Label>
            <Textarea
              id="client-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes about the client, domain, or engagement."
              rows={5}
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
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
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : initialClient ? (
                'Save Changes'
              ) : (
                'Create Client'
              )}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
