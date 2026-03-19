import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AllocationStatus, UserRole, type UserProfile } from '@/shared/types';

interface UserProfileDetailsTabProps {
  user: UserProfile & {
    teams?: Array<{
      id: string;
      name: string;
    }>;
  };
}

const roleLabels: Record<UserRole, string> = {
  COMPANY_ADMIN: 'Company Admin',
  TEAM_LEAD: 'Team Lead',
  DEVELOPER: 'Developer',
};

const allocationLabels: Record<AllocationStatus, string> = {
  BILLABLE: 'Billable',
  BENCH: 'Bench',
  INTERNAL_PROJECT: 'Internal Project',
};

const renderList = (items?: string[] | null, fallback = 'Not added yet') => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-muted-foreground">{fallback}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="bg-background">
          {item}
        </Badge>
      ))}
    </div>
  );
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : 'Not available';

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="space-y-1">
    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export const UserProfileDetailsTab = ({ user }: UserProfileDetailsTabProps) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Identity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Full Name" value={user.full_name} />
        <DetailItem label="Email" value={user.email || 'Not available'} />
        <DetailItem label="Role" value={roleLabels[user.role] || user.role} />
        <DetailItem label="Joined" value={formatDate(user.created_at)} />
        <DetailItem
          label="Seniority"
          value={user.seniority_level || 'Not added yet'}
        />
        <DetailItem
          label="Allocation"
          value={
            user.allocation_status
              ? allocationLabels[user.allocation_status]
              : 'Not added yet'
          }
        />
        <DetailItem
          label="GitHub"
          value={user.github_url || 'Not added yet'}
        />
        <DetailItem
          label="LinkedIn"
          value={user.linkedin_url || 'Not added yet'}
        />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent>
        {user.teams && user.teams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.teams.map((team) => (
              <Badge key={team.id} variant="secondary">
                {team.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">This user is not part of any team yet.</p>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Skills and Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Core Skills</p>
          {renderList(user.core_skills)}
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium">Industry Domains</p>
          {renderList(user.industry_domains)}
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium">Certifications</p>
          {renderList(user.certifications)}
        </div>
      </CardContent>
    </Card>
  </div>
);
