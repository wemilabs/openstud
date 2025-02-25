"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

interface NavItem {
  title: string
  href: string
  icon: keyof typeof Icons
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
    title: "Assignments",
    href: "/dashboard/assignments",
    icon: "pencil",
  },
  {
    title: "Schedule",
    href: "/dashboard/schedule",
    icon: "calendar",
  },
  {
    title: "Progress",
    href: "/dashboard/progress",
    icon: "barChart",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2 p-4">
      <div className="flex items-center space-x-4 rounded-lg px-3 py-2">
        <span className="text-lg font-semibold">Dashboard</span>
      </div>
      <div className="grid gap-1 pt-2">
        {navItems.map((item) => {
          const Icon = Icons[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline",
                "justify-start h-10"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
