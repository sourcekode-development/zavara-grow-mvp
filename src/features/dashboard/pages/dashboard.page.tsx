import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router";

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.profile?.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Your current learning objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#3DCF8E]">3</div>
            <p className="text-xs text-muted-foreground">
              2 in progress, 1 pending review
            </p>
          </CardContent>
        </Card>

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
            <div className="text-2xl font-bold text-[#3DCF8E]">12 days</div>
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
