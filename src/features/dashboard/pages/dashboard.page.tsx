import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router";
import { useGoals } from "@/features/goals/hooks/useGoals";
import { GoalStatus } from "@/features/goals/types";
import { differenceInCalendarDays } from "date-fns";

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { goals } = useGoals({ user_id: user?.id });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const overallGoalsCount = goals.length;

  const completedCount = goals.filter((goal) => {
    const totalEffort = Number(goal.effort ?? 0);
    const completedEffort = Number(goal.completed_effort ?? 0);
    return (
      goal.status !== GoalStatus.ABANDONED &&
      totalEffort > 0 &&
      completedEffort >= totalEffort
    );
  }).length;

  const inProgressCount = goals.filter(
    (goal) => {
      const totalEffort = Number(goal.effort ?? 0);
      const completedEffort = Number(goal.completed_effort ?? 0);
      const hasApprovedReview = goal.status === GoalStatus.APPROVED || goal.status === GoalStatus.IN_PROGRESS;

      return (
        goal.status !== GoalStatus.ABANDONED &&
        hasApprovedReview &&
        totalEffort > 0 &&
        completedEffort < totalEffort
      );
    }
  ).length;

  const pendingReviewCount = goals.filter(
    (goal) =>
      goal.status === GoalStatus.PENDING_REVIEW ||
      goal.status === GoalStatus.CHANGES_REQUESTED
  ).length;

  const currentCadenceStreak = goals.reduce((maxStreak, goal) => {
    if (!goal.last_effort_date || goal.current_streak <= 0) {
      return maxStreak;
    }

    const daysSinceLastEffort = differenceInCalendarDays(
      new Date(),
      new Date(goal.last_effort_date)
    );

    // Grace period: keep streak for up to 2 days without effort.
    const effectiveStreak = daysSinceLastEffort <= 2 ? goal.current_streak : 0;
    return Math.max(maxStreak, effectiveStreak);
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.profile?.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Overall Goals</CardTitle>
            <CardDescription>All goals created by you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">{overallGoalsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
            <CardDescription>Approved goals with remaining effort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Goals with 100% effort progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Review</CardTitle>
            <CardDescription>Waiting review or changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">{pendingReviewCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>KPI Score</CardTitle>
            <CardDescription>Latest performance rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">4.5/5</div>
            <p className="text-xs text-muted-foreground">
              Excellent performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cadence Streak</CardTitle>
            <CardDescription>Days of continuous learning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">
              {currentCadenceStreak} {currentCadenceStreak === 1 ? "day" : "days"}
            </div>
            <p className="text-xs text-muted-foreground">
              Keep up the great work!
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user?.profile?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium">
                  {user?.profile?.role?.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company ID</p>
                <p className="font-mono text-sm">{user?.profile?.company_id}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
