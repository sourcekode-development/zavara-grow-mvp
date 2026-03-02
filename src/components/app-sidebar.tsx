"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { 
  LayoutDashboardIcon, 
  UsersIcon, 
  TargetIcon, 
  TrendingUpIcon,
  UsersRoundIcon 
} from "lucide-react"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { UserRole } from "@/shared/types"

// Navigation configuration based on roles
const getNavigationItems = (role?: string) => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
  ];

  // Items available to all authenticated users (Developers)
  const developerGoalItems = [
    {
      title: "Goals",
      url: "/goals",
      icon: <TargetIcon />,
      items: [
        {
          title: "My Goals",
          url: "/goals",
        },
        {
          title: "Today's Sessions",
          url: "/sessions/today",
        },
        {
          title: "My Checkpoints",
          url: "/goals/checkpoints/my",
        },
      ],
    },
  ];

  // Goals items for Team Leads and Admins (includes review submenu)
  const managementGoalItems = [
    {
      title: "Goals",
      url: "/goals",
      icon: <TargetIcon />,
      items: [
        {
          title: "All Goals",
          url: "/goals",
        },
        {
          title: "Pending Review",
          url: "/goals/review",
        },
        {
          title: "Today's Sessions",
          url: "/sessions/today",
        },
        {
          title: "My Checkpoints",
          url: "/goals/checkpoints/my",
        },
        {
          title: "Review Checkpoints",
          url: "/checkpoints",
        },
      ],
    },
  ];

  // KPI items for developers (view only)
  const developerKpiItems = [
    {
      title: "KPIs",
      url: "/kpis/your-kpis",
      icon: <TrendingUpIcon />,
      items: [
        {
          title: "Your KPIs",
          url: "/kpis/your-kpis",
        },
      ],
    },
  ];

  // KPI items for Team Leads and Admins (full management)
  const managementKpiItems = [
    {
      title: "KPIs",
      url: "/kpis/templates",
      icon: <TrendingUpIcon />,
      items: [
        {
          title: "Templates",
          url: "/kpis/templates",
        },
        {
          title: "Categories",
          url: "/kpis/categories",
        },
        {
          title: "Developer KPIs",
          url: "/kpis/developer-kpis",
        },
        {
          title: "Claims",
          url: "/kpis/claims",
        },
        {
          title: "Your KPIs",
          url: "/kpis/your-kpis",
        },
      ],
    },
  ];

  // Items available to Team Leads and Admins
  const teamItems = [
    {
      title: "Teams",
      url: "/teams",
      icon: <UsersRoundIcon />,
    },
  ];

  // Items available to Admins only
  const adminItems = [
    {
      title: "Users",
      url: "/users",
      icon: <UsersIcon />,
      items: [
        {
          title: "All Users",
          url: "/users",
        },
        {
          title: "Invites",
          url: "/users/invites",
        },
      ],
    },
  ];

  // Build navigation based on role
  if (role === UserRole.COMPANY_ADMIN) {
    return [...baseItems, ...managementGoalItems, ...managementKpiItems, ...teamItems, ...adminItems];
  } else if (role === UserRole.TEAM_LEAD) {
    return [...baseItems, ...managementGoalItems, ...managementKpiItems, ...teamItems];
  } else {
    // DEVELOPER or default
    return [...baseItems, ...developerGoalItems, ...developerKpiItems, ...teamItems];
  }
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();
  const navItems = getNavigationItems(user?.profile?.role);

  const userData = {
    name: user?.profile?.full_name || "User",
    email: user?.email || "",
    avatar: "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2 overflow-clip">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-bold">
            <img src="/zavara-logo.svg" alt="Zavara Logo" className="h-7 w-7 inline-block" />{" "}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Zavara Grow</span>
            <span className="text-xs text-muted-foreground">
              {user?.profile?.role?.replace("_", " ") || "User"}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
