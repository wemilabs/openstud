"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../mode-toggle";
import { Logo } from "@/components/layout/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Image from "next/image";

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
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex lg:flex-1">
            <Logo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge
                variant="secondary"
                className="absolute -right-1 -top-1 h-4 w-4 p-0"
              >
                0
              </Badge>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 flex items-center gap-2"
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
                  <span className="hidden md:inline-block">
                    {user?.name || "Account"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
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
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center"
                  >
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
          </nav>
        </div>
      </div>
    </header>
  );
}
