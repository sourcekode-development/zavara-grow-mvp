import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LoginPage } from "@/features/auth/pages/login.page";
import { SignupPage } from "@/features/auth/pages/signup.page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard.page";
import { TeamsPage } from "@/features/teams/pages/teams.page";
import { TeamDetailPage } from "@/features/teams/pages/team-detail.page";
import { GoalsPage } from "@/features/goals/pages/goals.page";
import { GoalCreatePage } from "@/features/goals/pages/goal-create.page";
import { GoalEditPage } from "@/features/goals/pages/goal-edit.page";
import { GoalDetailPage } from "@/features/goals/pages/goal-detail.page";
import { GoalsReviewPage } from "@/features/goals/pages/goals-review.page";
import { TodaySessionsPage } from "@/features/goals/pages/today-sessions.page";
import { CheckpointsListPage } from "@/features/goals/pages/checkpoints-list.page";
import { MyCheckpointsPage } from "@/features/goals/pages/my-checkpoints.page";
import { UsersPage } from "@/features/users/pages/users.page";
import { UserInvitesPage } from "@/features/users/pages/user-invites.page";
import { AppLayout } from "@/app/layout";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useEffect } from "react";
import { KpiTemplatesPage } from "@/features/kpis/pages/kpi-templates.page";
import { KpiCategoriesPage } from "@/features/kpis/pages/kpi-categories.page";
import { DevelopersKpisListPage } from "@/features/kpis/pages/developers-kpis-list.page";
import { KpiClaimsPage } from "@/features/kpis/pages/kpi-claims.page";
import { YourKpisPage } from "@/features/kpis/pages/your-kpis.page";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3DCF8E] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3DCF8E] border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Session Checker Component
const SessionChecker = ({ children }: { children: React.ReactNode }) => {
  const { checkSession } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return <>{children}</>;
};

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <SessionChecker>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            
            {/* Goals Routes */}
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/goals/create" element={<GoalCreatePage />} />
            <Route path="/goals/review" element={<GoalsReviewPage />} />
            <Route path="/goals/:id" element={<GoalDetailPage />} />
            <Route path="/goals/:id/edit" element={<GoalEditPage />} />
            <Route path="/sessions/today" element={<TodaySessionsPage />} />            <Route path="/goals/checkpoints/my" element={<MyCheckpointsPage />} />            <Route path="/checkpoints" element={<CheckpointsListPage />} />
            
            {/* KPI Routes */}
            <Route path="/kpis/templates" element={<KpiTemplatesPage />} />
            <Route path="/kpis/categories" element={<KpiCategoriesPage />} />
            <Route path="/kpis/developer-kpis" element={<DevelopersKpisListPage />} />
            <Route path="/kpis/claims" element={<KpiClaimsPage />} />
            <Route path="/kpis/your-kpis" element={<YourKpisPage />} />
            
            {/* User Routes */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/invites" element={<UserInvitesPage />} />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] dark:bg-[#11181C]">
                <div className="text-center">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p className="mt-2 text-muted-foreground">Page not found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </SessionChecker>
    </BrowserRouter>
  );
};
