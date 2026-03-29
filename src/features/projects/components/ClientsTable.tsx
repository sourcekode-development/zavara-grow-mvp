import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import type { ClientWithStats } from '../types';

interface ClientsTableProps {
  clients: ClientWithStats[];
  isLoading: boolean;
  onViewClient?: (client: ClientWithStats) => void;
  onEditClient?: (client: ClientWithStats) => void;
}

export const ClientsTable = ({
  clients,
  isLoading,
  onViewClient,
  onEditClient,
}: ClientsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-12 text-center">
        <h3 className="text-lg font-semibold">No clients found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Create clients for external delivery work, or leave projects internal when no client exists.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div className="font-medium">{client.name}</div>
              </TableCell>
              <TableCell>
                {client.description ? (
                  <span
                    className="block max-w-[420px] truncate text-sm text-muted-foreground"
                    title={client.description}
                  >
                    {client.description}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">No description</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{client.project_count} linked</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onViewClient ? (
                    <Button variant="outline" size="sm" onClick={() => onViewClient(client)}>
                      View
                    </Button>
                  ) : null}
                  {onEditClient ? (
                    <Button variant="ghost" size="sm" onClick={() => onEditClient(client)}>
                      Edit
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
