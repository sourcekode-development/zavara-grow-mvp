import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Field, FieldLabel, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagsInput } from '@/components/ui/tags-input';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { AllocationStatus } from '@/shared/types';
import { useNavigate } from 'react-router';

export function ProfilePage() {
  const { user } = useAuthStore();
  const { updateProfile, isSubmitting } = useUpdateProfile();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    seniority_level: '',
    github_url: '',
    linkedin_url: '',
    allocation_status: '',
    core_skills: [] as string[],
    industry_domains: [] as string[],
    certifications: [] as string[],
  });

  // Pre-fill form when user is available
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        full_name: user.profile.full_name || '',
        seniority_level: user.profile.seniority_level || '',
        github_url: user.profile.github_url || '',
        linkedin_url: user.profile.linkedin_url || '',
        allocation_status: user.profile.allocation_status || '',
        core_skills: user.profile.core_skills || [],
        industry_domains: user.profile.industry_domains || [],
        certifications: user.profile.certifications || [],
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.profile?.id) return;

    // Convert empty strings to null for optional enums if needed
    const updates = {
      ...formData,
      allocation_status: formData.allocation_status ? (formData.allocation_status as AllocationStatus) : null,
      seniority_level: formData.seniority_level || null,
      github_url: formData.github_url || null,
      linkedin_url: formData.linkedin_url || null,
    };

    await updateProfile(user.profile.id, updates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your basic profile details visible to your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="seniority_level">Seniority Level</FieldLabel>
                  <Select
                    value={formData.seniority_level}
                    onValueChange={(val) => setFormData({ ...formData, seniority_level: val })}
                  >
                    <SelectTrigger id="seniority_level">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Trainee">Trainee</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="allocation_status">Allocation Status</FieldLabel>
                  <Select
                    value={formData.allocation_status}
                    onValueChange={(val) => setFormData({ ...formData, allocation_status: val })}
                  >
                    <SelectTrigger id="allocation_status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AllocationStatus.BILLABLE}>Billable</SelectItem>
                      <SelectItem value={AllocationStatus.BENCH}>Bench</SelectItem>
                      <SelectItem value={AllocationStatus.INTERNAL_PROJECT}>Internal Project</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Skills &amp; Experience</CardTitle>
            <CardDescription>
              Help your team leaders map your capabilities to the right projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Core Skills</FieldLabel>
                <TagsInput
                  value={formData.core_skills}
                  onChange={(val) => setFormData({ ...formData, core_skills: val })}
                  placeholder="e.g. React, Node.js (Press Enter)"
                />
              </Field>

              <Field>
                <FieldLabel>Industry Domains</FieldLabel>
                <TagsInput
                  value={formData.industry_domains}
                  onChange={(val) => setFormData({ ...formData, industry_domains: val })}
                  placeholder="e.g. Healthcare, FinTech (Press Enter)"
                />
              </Field>

              <Field>
                <FieldLabel>Certifications</FieldLabel>
                <TagsInput
                  value={formData.certifications}
                  onChange={(val) => setFormData({ ...formData, certifications: val })}
                  placeholder="e.g. AWS Certified Developer (Press Enter)"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Professional Links</CardTitle>
            <CardDescription>Links to your professional profiles and portfolios.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="github_url">GitHub URL</FieldLabel>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="linkedin_url">LinkedIn URL</FieldLabel>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex justify-end pt-6">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3DCF8E] hover:bg-[#3DCF8E]/90"
            >
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
