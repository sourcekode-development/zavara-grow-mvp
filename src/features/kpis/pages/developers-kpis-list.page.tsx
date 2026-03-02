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
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { AssignKpiDialog } from '../components/AssignKpiDialog';
import { DeveloperKpisTable } from '../components/DeveloperKpisTable';
import { KpiDrawer } from '../components/KpiDrawer';
import { KpiProgressCard } from '../components/KpiProgressCard';
import { useDeveloperKpis, useUpdateKpiStatus } from '../hooks/useDeveloperKpis';
import type { DeveloperKpiWithMetrics } from '../types';

export const DevelopersKpisListPage = () => {
  const { developerKpis, isLoading, filters, updateFilters, refetch } =
    useDeveloperKpis();
  const { updateStatus } = useUpdateKpiStatus();

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<DeveloperKpiWithMetrics | null>(
    null
  );

  const handleViewKpi = (kpi: DeveloperKpiWithMetrics) => {
    setSelectedKpi(kpi);
    setViewDrawerOpen(true);
  };

  const handleStatusUpdate = async (
    id: string,
    status: 'COMPLETED' | 'ARCHIVED'
  ) => {
    const result = await updateStatus(id, status);

    if (result.data && !result.error) {
      toast.success(`KPI marked as ${status.toLowerCase()}`);
      refetch();
    } else {
      toast.error(result.error || 'Failed to update KPI status');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    updateFilters({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Developer KPIs</h1>
          <p className="text-muted-foreground mt-1">
            Assign and track KPI performance for developers
          </p>
        </div>
        <Button onClick={() => setAssignDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Assign KPI
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by developer name..."
                className="pl-9"
                value={filters.developer_name || ''}
                onChange={(e) =>
                  handleFilterChange('developer_name', e.target.value)
                }
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.cycle_type || 'all'}
              onValueChange={(value) => handleFilterChange('cycle_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading developer KPIs...
        </div>
      ) : (
        <DeveloperKpisTable
          developerKpis={developerKpis}
          onViewKpi={handleViewKpi}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Assign KPI Dialog */}
      <AssignKpiDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        onSuccess={refetch}
      />

      {/* View KPI Drawer */}
      <KpiDrawer
        open={viewDrawerOpen}
        onOpenChange={setViewDrawerOpen}
        title="KPI Details"
        size="large"
      >
        {selectedKpi && <KpiProgressCard kpi={selectedKpi} />}
      </KpiDrawer>
    </div>
  );
};