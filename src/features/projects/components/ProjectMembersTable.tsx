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
import type { ProjectMemberWithProfile } from '../types';

interface ProjectMembersTableProps {
  members: ProjectMemberWithProfile[];
  title: string;
  emptyMessage: string;
  canManage: boolean;
  onEditMember?: (member: ProjectMemberWithProfile) => void;
  onRemoveMember?: (member: ProjectMemberWithProfile) => void;
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active';

export const ProjectMembersTable = ({
  members,
  title,
  emptyMessage,
  canManage,
  onEditMember,
  onRemoveMember,
}: ProjectMembersTableProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>

      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Left</TableHead>
                <TableHead>Reviewer</TableHead>
                {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.profile.full_name}</div>
                      <div className="text-sm text-muted-foreground">{member.profile.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{member.project_role.replace('_', ' ')}</TableCell>
                  <TableCell>{formatDate(member.joined_at)}</TableCell>
                  <TableCell>{formatDate(member.left_at)}</TableCell>
                  <TableCell>
                    {member.is_primary_reviewer ? (
                      <Badge className="bg-[#3DCF8E] text-white hover:bg-[#3DCF8E]">
                        Primary
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {onEditMember ? (
                          <Button variant="ghost" size="sm" onClick={() => onEditMember(member)}>
                            Edit
                          </Button>
                        ) : null}
                        {!member.left_at && !member.removed_at && onRemoveMember ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onRemoveMember(member)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
