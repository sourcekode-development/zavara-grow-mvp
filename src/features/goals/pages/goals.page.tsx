import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router';
import { Plus, Target } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useGoals } from '../hooks/useGoals';
import { GoalCard } from '../components/goal-card';
import { GoalsFilters } from '../components/goals-filters';
import { EmptyState } from '../components/empty-state';

export const GoalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch goals for the current user
  const { goals, isLoading, error } = useGoals({
    user_id: user?.id,
  });

  // Filter goals based on search and status
  const filteredGoals = useMemo(() => {
    let filtered = goals;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (goal) =>
          goal.title.toLowerCase().includes(query) ||
          goal.description?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((goal) => goal.status === statusFilter);
    }

    return filtered;
  }, [goals, searchQuery, statusFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const handleCreateGoal = () => {
    navigate('/goals/create');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your upskilling journey
          </p>
        </div>
        <Button
          onClick={handleCreateGoal}
          className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      </div>

      {/* Filters */}
      <GoalsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3 p-6 border rounded-lg">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals Grid */}
      {!isLoading && filteredGoals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Empty State - No Goals */}
      {!isLoading && !error && goals.length === 0 && (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Create your first upskilling goal to start tracking your learning journey."
          actionLabel="Create Your First Goal"
          onAction={handleCreateGoal}
        />
      )}

      {/* Empty State - No Results */}
      {!isLoading && goals.length > 0 && filteredGoals.length === 0 && (
        <EmptyState
          icon={Target}
          title="No goals found"
          description="Try adjusting your filters or search query to find what you're looking for."
          actionLabel="Clear Filters"
          onAction={handleClearFilters}
        />
      )}
    </div>
  );
};
