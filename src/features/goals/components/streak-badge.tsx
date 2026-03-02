import { Badge } from '@/components/ui/badge';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StreakBadge = ({ streak, size = 'md', className }: StreakBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const showCelebration = streak >= 7;

  return (
    <Badge
      variant="secondary"
      className={`${sizeClasses[size]} bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30 font-semibold ${className || ''}`}
    >
      🔥 {streak} {streak === 1 ? 'day' : 'days'}
      {showCelebration && ' 🎉'}
    </Badge>
  );
};
