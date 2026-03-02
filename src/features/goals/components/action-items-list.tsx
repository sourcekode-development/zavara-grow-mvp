import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock } from 'lucide-react';
import type { ActionItem } from '../types';

interface ActionItemsListProps {
  actionItems: ActionItem[] | string | null | undefined;
}

export const ActionItemsList = ({ actionItems }: ActionItemsListProps) => {
  // Parse if string (defensive check)
  let items: ActionItem[];
  
  if (!actionItems) {
    return null;
  }

  try {
    items = typeof actionItems === 'string' 
      ? JSON.parse(actionItems) 
      : actionItems;
  } catch {
    return null;
  }

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const priorityConfig = {
    HIGH: {
      color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      label: 'High Priority',
    },
    MEDIUM: {
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      label: 'Medium Priority',
    },
    LOW: {
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      label: 'Low Priority',
    },
  };

  return (
    <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
          <AlertCircle className="h-5 w-5" />
          Action Items to Address
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete these items to improve and move forward
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 border rounded-lg"
            >
              {/* Number Badge */}
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#3DCF8E]/10 text-[#3DCF8E] font-semibold text-sm shrink-0 mt-0.5">
                {idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-relaxed">{item.task}</p>

                {/* Metadata */}
                <div className="flex flex-wrap gap-3 mt-2">
                  {item.duration_minutes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Est. {item.duration_minutes} min</span>
                    </div>
                  )}

                  {item.priority && (
                    <Badge className={`text-xs ${priorityConfig[item.priority].color}`}>
                      {priorityConfig[item.priority].label}
                    </Badge>
                  )}
                </div>

                {/* Resources */}
                {item.resources && item.resources.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <p className="font-medium mb-1">Resources:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {item.resources.map((resource, resourceIdx) => (
                        <li key={resourceIdx} className="text-muted-foreground">
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
