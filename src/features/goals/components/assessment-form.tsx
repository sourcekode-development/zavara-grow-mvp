import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

export interface AssessmentFormData {
  feedback: string;
  strengths?: string;
  improvements?: string;
  action_items: string[];
}

interface AssessmentFormProps {
  initialData?: Partial<AssessmentFormData>;
  onChange: (data: AssessmentFormData) => void;
}

export const AssessmentForm = ({
  initialData = {},
  onChange,
}: AssessmentFormProps) => {
  const [formData, setFormData] = useState<AssessmentFormData>({
    feedback: initialData.feedback || '',
    strengths: initialData.strengths || '',
    improvements: initialData.improvements || '',
    action_items: initialData.action_items || [],
  });

  const [newActionItem, setNewActionItem] = useState('');

  const updateForm = (updates: Partial<AssessmentFormData>) => {
    const updated = { ...formData, ...updates };
    setFormData(updated);
    onChange(updated);
  };

  const addActionItem = () => {
    if (newActionItem.trim()) {
      updateForm({
        action_items: [...formData.action_items, newActionItem.trim()],
      });
      setNewActionItem('');
    }
  };

  const removeActionItem = (index: number) => {
    updateForm({
      action_items: formData.action_items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      {/* Overall Feedback */}
      <div className="space-y-2">
        <Label htmlFor="feedback">
          Overall Feedback <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="feedback"
          placeholder="Provide comprehensive feedback on the developer's progress..."
          value={formData.feedback}
          onChange={(e) => updateForm({ feedback: e.target.value })}
          rows={5}
          required
        />
        <p className="text-xs text-muted-foreground">
          Summarize the developer's performance, goal achievement, and overall progress.
        </p>
      </div>

      {/* Strengths */}
      <div className="space-y-2">
        <Label htmlFor="strengths">Key Strengths (Optional)</Label>
        <Textarea
          id="strengths"
          placeholder="What did the developer do well?"
          value={formData.strengths}
          onChange={(e) => updateForm({ strengths: e.target.value })}
          rows={3}
        />
      </div>

      {/* Areas for Improvement */}
      <div className="space-y-2">
        <Label htmlFor="improvements">Areas for Improvement (Optional)</Label>
        <Textarea
          id="improvements"
          placeholder="What areas need focus?"
          value={formData.improvements}
          onChange={(e) => updateForm({ improvements: e.target.value })}
          rows={3}
        />
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="newActionItem">Add Action Item</Label>
            <div className="flex gap-2">
              <Input
                id="newActionItem"
                placeholder="e.g., Complete AWS Lambda tutorial"
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addActionItem();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addActionItem}
                disabled={!newActionItem.trim()}
                className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add
              </Button>
            </div>
          </div>

          {formData.action_items.length > 0 && (
            <div className="space-y-2">
              <Label>Current Action Items ({formData.action_items.length})</Label>
              <div className="space-y-2">
                {formData.action_items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg group"
                  >
                    <span className="flex-1 text-sm">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActionItem(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.action_items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No action items yet. Add specific next steps for the developer.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
