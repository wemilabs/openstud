"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Logo } from "@/components/layout/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Slash,
  CircleHelp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RightSideMenu } from "@/components/dashboard/right-side-menu";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { Icons } from "../icons";

export function DashboardHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center px-2 py-4 md:px-8 md:py-6 max-w-full">
        {/* Logo and Navigation */}
        <div className="flex items-center">
          <Logo
            href="/dashboard"
            className="hidden md:flex items-center px-4"
          />
          <RightSideMenu className="md:hidden mx-2 cursor-pointer" />

          {/* Divider slash */}
          <span className="hidden md:block font-thin text-2xl text-muted-foreground">
            /
          </span>

          {/* Team selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button variant="ghost" className="h-8 gap-1 px-2 font-normal">
                <span className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5 py-0"
                  >
                    P
                  </Badge>
                  <span className="font-medium">Personal Team</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Personal Team</DropdownMenuItem>
              <DropdownMenuItem>Create New Team</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Divider slash */}
          <span className="hidden md:block font-thin text-2xl text-muted-foreground">
            /
          </span>

          {/* Project selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="hidden md:flex">
              <Button variant="ghost" className="h-8 gap-1 px-2 font-normal">
                <span className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5 py-0"
                  >
                    AY
                  </Badge>
                  <span className="font-medium">2024-2025</span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>2024-2025</DropdownMenuItem>
              <DropdownMenuItem>Add New Academic Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side controls */}
        <div className="flex flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer"
          >
            <Bell className="size-4" />
            {/* <Badge
              variant="secondary"
              className="absolute right-1 top-0 h-4 w-4 p-0"
            >
              0
            </Badge> */}
          </Button>

          <Link
            href="/docs/introduction"
            className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-normal transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground h-8 px-3 has-[>svg]:px-2.5"
          >
            <Icons.help className="size-4" />
          </Link>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button
                variant="ghost"
                className="relative h-8 flex items-center gap-2 ml-2 mr-4"
              >
                <Avatar className="h-8 w-8">
                  {user?.image ? (
                    <div className="relative aspect-square h-full w-full">
                      <Image
                        src={user.image}
                        alt={user.name ?? ""}
                        className="rounded-full object-cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    </div>
                  ) : (
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "Guest"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
