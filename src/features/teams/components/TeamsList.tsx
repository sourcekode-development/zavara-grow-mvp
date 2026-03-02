import { Users, Calendar, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TeamWithDetails } from '../types';

interface TeamsListProps {
  teams: TeamWithDetails[];
  isLoading: boolean;
  canCreate: boolean;
  onTeamClick: (teamId: string) => void;
  onEditTeam?: (team: TeamWithDetails) => void;
  onDeleteTeam?: (team: TeamWithDetails) => void;
  currentUserId?: string;
  userRole?: string;
}

export const TeamsList = ({
  teams,
  isLoading,
  canCreate,
  onTeamClick,
  onEditTeam,
  onDeleteTeam,
  currentUserId,
  userRole,
}: TeamsListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canEditTeam = (team: TeamWithDetails) => {
    if (userRole === 'COMPANY_ADMIN') return true;
    if (userRole === 'TEAM_LEAD' && team.created_by === currentUserId) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-[#1A2633]">
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <Card className="bg-white dark:bg-[#1A2633]">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No Teams Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {canCreate
              ? 'Create your first team to start organizing your developers.'
              : "You haven't been added to any teams yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => {
        const canEdit = canEditTeam(team);

        return (
          <Card
            key={team.id}
            className="bg-white dark:bg-[#1A2633] hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onTeamClick(team.id)}
                >
                  <CardTitle className="text-lg mb-2 text-gray-900 dark:text-gray-100 group-hover:text-[#3DCF8E] transition-colors">
                    {team.name}
                  </CardTitle>
                </div>
                {canEdit && (onEditTeam || onDeleteTeam) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white dark:bg-[#1A2633]"
                    >
                      {onEditTeam && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTeam(team);
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Team
                        </DropdownMenuItem>
                      )}
                      {onEditTeam && onDeleteTeam && <DropdownMenuSeparator />}
                      {onDeleteTeam && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTeam(team);
                          }}
                          className="cursor-pointer text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Team
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>

            <CardContent
              className="cursor-pointer"
              onClick={() => onTeamClick(team.id)}
            >
              <div className="space-y-3">
                {/* Member Count */}
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Users className="w-4 h-4 text-[#3DCF8E]" />
                  <span className="text-sm">
                    {team.member_count || 0} {team.member_count === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                {/* Creator Info */}
                {team.creator && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Created by:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {team.creator.full_name}
                    </span>
                    {team.creator.role === 'COMPANY_ADMIN' && (
                      <Badge
                        variant="secondary"
                        className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                      >
                        Admin
                      </Badge>
                    )}
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatDate(team.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
