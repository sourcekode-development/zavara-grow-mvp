import { Users, Calendar, TrendingUp, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { TeamMemberWithProgress } from '../types';

interface TeamMembersListProps {
  members: TeamMemberWithProgress[];
  isLoading: boolean;
}

export const TeamMembersList = ({ members, isLoading }: TeamMembersListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'COMPANY_ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'TEAM_LEAD':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'DEVELOPER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'ON_HOLD':
      case 'DRAFT':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-[#1A2633]">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#1A2633]">
        <CardContent className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No Team Members
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add members to this team to start tracking their progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card
          key={member.user_id}
          className="bg-sidebar hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            {/* Member Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-[#3DCF8E] text-white font-semibold">
                    {getInitials(member.profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {member.profile.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {member.profile.email}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={getRoleBadgeColor(member.profile.role)}
              >
                {member.profile.role.replace('_', ' ')}
              </Badge>
            </div>

            {/* Progress Section */}
            <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Recent Goal */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Target className="w-4 h-4 text-[#3DCF8E]" />
                  Recent Goal
                </div>
                {member.recent_goal ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                        {member.recent_goal.goal_title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getStatusBadgeColor(member.recent_goal.status)}
                      >
                        {member.recent_goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress
                        value={member.recent_goal.progress_percentage}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>{member.recent_goal.progress_percentage}% Complete</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(member.recent_goal.last_updated)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active goal
                  </p>
                )}
              </div>

              {/* Recent KPI */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <TrendingUp className="w-4 h-4 text-[#3DCF8E]" />
                  Recent KPI
                </div>
                {member.recent_kpi ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-2">
                        {member.recent_kpi.kpi_title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={getStatusBadgeColor(member.recent_kpi.status)}
                      >
                        {member.recent_kpi.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress
                        value={member.recent_kpi.total_score_percentage}
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          {member.recent_kpi.accumulated_points}/{member.recent_kpi.target_points} pts
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(member.recent_kpi.last_updated)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No active KPI
                  </p>
                )}
              </div>
            </div>

            {/* Member Info Footer */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
              <span>Joined: {formatDate(member.joined_at)}</span>
              {member.adder && (
                <span>Added by: {member.adder.full_name}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
