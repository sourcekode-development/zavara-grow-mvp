import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FrequencyType } from '../types';
import type { FrequencyConfig } from '../types';

interface FrequencyConfigFormProps {
  frequencyType: FrequencyType | null;
  frequencyConfig: FrequencyConfig | null;
  onChange: (type: FrequencyType, config: FrequencyConfig) => void;
}

const daysOfWeek = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
];

export const FrequencyConfigForm = ({
  frequencyType,
  frequencyConfig,
  onChange,
}: FrequencyConfigFormProps) => {
  const handleTypeChange = (value: FrequencyType) => {
    const defaultConfig: FrequencyConfig = {
      duration_minutes: 60,
    };

    if (value === 'WEEKDAYS') {
      defaultConfig.days = [1, 2, 3, 4, 5];
    } else if (value === 'WEEKENDS') {
      defaultConfig.days = [0, 6];
    } else if (value === 'CUSTOM') {
      defaultConfig.days = [];
    }

    onChange(value, defaultConfig);
  };

  const handleDurationChange = (minutes: number) => {
    onChange(frequencyType || 'DAILY', {
      ...frequencyConfig,
      duration_minutes: minutes,
    });
  };

  const handleCustomDayToggle = (day: number) => {
    const currentDays = frequencyConfig?.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort();
    
    onChange(frequencyType || 'CUSTOM', {
      ...frequencyConfig,
      days: newDays,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Frequency</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How often will you work on this goal?
        </p>
      </div>

      {/* Frequency Type */}
      <div className="space-y-2">
        <Label>Schedule Type</Label>
        <Select
          value={frequencyType || ''}
          onValueChange={(value) => handleTypeChange(value as FrequencyType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FrequencyType.DAILY}>
              Daily (Every day)
            </SelectItem>
            <SelectItem value={FrequencyType.WEEKDAYS}>
              Weekdays (Mon-Fri)
            </SelectItem>
            <SelectItem value={FrequencyType.WEEKENDS}>
              Weekends (Sat-Sun)
            </SelectItem>
            <SelectItem value={FrequencyType.CUSTOM}>
              Custom Schedule
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Days Selection */}
      {frequencyType === 'CUSTOM' && (
        <div className="space-y-2">
          <Label>Select Days</Label>
          <div className="grid grid-cols-2 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={frequencyConfig?.days?.includes(day.value) || false}
                  onCheckedChange={() => handleCustomDayToggle(day.value)}
                />
                <label
                  htmlFor={`day-${day.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration */}
      <div className="space-y-2">
        <Label>Session Duration</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={frequencyConfig?.duration_minutes || 60}
            onChange={(e) =>
              handleDurationChange(parseInt(e.target.value) || 60)
            }
            min="15"
            max="480"
            step="15"
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">minutes per session</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Recommended: 60 minutes for effective learning
        </p>
      </div>
    </div>
  );
};
