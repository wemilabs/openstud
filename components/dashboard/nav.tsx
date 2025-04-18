"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import LoadingIndicator from "./loading-indicator";

interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof Icons;
}

interface DashboardNavProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: "layout",
  },
  {
    title: "Courses",
    href: "/dashboard/courses",
    icon: "book",
  },
  {
    title: "Marks",
    href: "/dashboard/marks",
    icon: "percent",
  },
  // {
  //   title: "Ask Clever",
  //   href: "/dashboard/ask-clever",
  //   icon: "bot",
  // },
  // {
  //   title: "Assignments",
  //   href: "/dashboard/assignments",
  //   icon: "pencil",
  // },
  {
    title: "Timetable",
    href: "/dashboard/timetable",
    icon: "calendarDays",
  },
  // {
  //   title: "Schedule",
  //   href: "/dashboard/schedule",
  //   icon: "calendar",
  // },
  {
    title: "Progress",
    href: "/dashboard/progress",
    icon: "chartNoAxesColumn",
  },
  {
    title: "Workspaces",
    href: "/dashboard/workspaces",
    icon: "users",
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: "billing",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
  },
  {
    title: "Help",
    href: "/docs/introduction",
    icon: "help",
  },
];

export function DashboardNav({ className }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("grid items-start gap-2 p-4", className)}>
      <div className="grid gap-1 pt-4 pl-8 md:mt-8">
        {navItems.map((item) => {
          const Icon = Icons[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted font-medium",
                "justify-start h-10"
              )}
            >
              <Icon className="mr-2 size-4" />
              {item.title} <LoadingIndicator />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
