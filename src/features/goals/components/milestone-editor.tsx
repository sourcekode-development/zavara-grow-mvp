import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Milestone } from '../types';

interface MilestoneEditorProps {
  milestones: Partial<Milestone>[];
  onChange: (milestones: Partial<Milestone>[]) => void;
}

export const MilestoneEditor = ({ milestones, onChange }: MilestoneEditorProps) => {
  const addMilestone = () => {
    const newMilestone: Partial<Milestone> = {
      title: '',
      description: '',
      order_index: milestones.length + 1,
      duration_days: undefined,
    };
    onChange([...milestones, newMilestone]);
  };

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    // Reorder remaining milestones
    const reordered = updated.map((m, i) => ({ ...m, order_index: i + 1 }));
    onChange(reordered);
  };

  const moveMilestone = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === milestones.length - 1)
    ) {
      return;
    }

    const updated = [...milestones];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    
    // Update order_index
    const reordered = updated.map((m, i) => ({ ...m, order_index: i + 1 }));
    onChange(reordered);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Milestones</h3>
          <p className="text-sm text-muted-foreground">
            Break down your goal into manageable phases
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMilestone}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Milestone
        </Button>
      </div>

      {milestones.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No milestones yet. Add your first milestone to get started.
          </p>
          <Button type="button" variant="outline" onClick={addMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Milestone
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <Card key={index} className="p-4">
              <div className="flex gap-3">
                {/* Drag Handle & Order */}
                <div className="flex flex-col items-center gap-1 pt-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => moveMilestone(index, 'up')}
                      disabled={index === 0}
                    >
                      ▲
                    </Button>
                    <span className="text-xs font-semibold text-center text-[#3DCF8E]">
                      {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => moveMilestone(index, 'down')}
                      disabled={index === milestones.length - 1}
                    >
                      ▼
                    </Button>
                  </div>
                </div>

                {/* Milestone Form */}
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Milestone title (e.g., Complete Course Module 1)"
                    value={milestone.title || ''}
                    onChange={(e) =>
                      updateMilestone(index, { title: e.target.value })
                    }
                    required
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={milestone.description || ''}
                    onChange={(e) =>
                      updateMilestone(index, { description: e.target.value })
                    }
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Duration (days)"
                      value={milestone.duration_days || ''}
                      onChange={(e) =>
                        updateMilestone(index, {
                          duration_days: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-32"
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMilestone(index)}
                  className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
