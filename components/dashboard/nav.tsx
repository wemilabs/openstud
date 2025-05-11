"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { UserRole } from "@/generated/prisma/client";

import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import LoadingIndicator from "@/components/dashboard/loading-indicator";

interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
  target?: string;
  rel?: string;
  allowedRoles: UserRole[];
}

interface DashboardNavProps {
  className?: string;
  userRole: UserRole | null | undefined;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: "layout",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Courses & Notes",
    href: "/dashboard/courses",
    icon: "book",
    allowedRoles: ["STUDENT"],
  },
  {
    title: "Marks",
    href: "/dashboard/marks",
    icon: "percent",
    allowedRoles: ["STUDENT"],
  },
  {
    title: "Ask Clever",
    href: "/dashboard/ask-clever",
    icon: "bot",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  // {
  //   title: "Assignments",
  //   href: "/dashboard/assignments",
  //   icon: "pencil",
  //   allowedRoles: ["STUDENT", "PROFESSOR"],
  // },
  {
    title: "Timetable",
    href: "/dashboard/timetable",
    icon: "calendarDays",
    allowedRoles: ["STUDENT", "PROFESSOR"],
  },
  // {
  //   title: "Schedule",
  //   href: "/dashboard/schedule",
  //   icon: "calendar",
  //   allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  // },
  {
    title: "Progress",
    href: "/dashboard/progress",
    icon: "chartNoAxesColumn",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Workspaces",
    href: "/dashboard/workspaces",
    icon: "users",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: "billing",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
  {
    title: "Help",
    href: "/docs/introduction", // in the future, it'll point to docs.openstud.(com/app/dev)
    icon: "help",
    target: "_blank",
    rel: "noopener noreferrer nofollow",
    allowedRoles: ["STUDENT", "PROFESSOR", "RESEARCHER", "SUPERVISOR", "ADMIN"],
  },
];

export function DashboardNav({ className, userRole }: DashboardNavProps) {
  const pathname = usePathname();
  const renderItemsAccordingToRole = navItems.filter((item) =>
    item.allowedRoles.includes(userRole!)
  );
  return (
    <nav className={cn("grid items-start gap-2 p-4", className)}>
      <div className="grid gap-1 pt-4 pl-8 md:mt-8">
        {renderItemsAccordingToRole.map(
          ({ href, icon, rel, title, target }) => {
            const Icon = Icons[icon];
            return (
              <Link
                key={href}
                href={href}
                rel={rel}
                target={target}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  pathname === href
                    ? "bg-muted font-semibold"
                    : "hover:bg-muted font-medium",
                  "justify-start h-10"
                )}
              >
                <Icon className="mr-2 size-4" />
                {title} <LoadingIndicator />
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}
