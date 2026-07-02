import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { DashboardNav } from "@/components/dashboard/nav";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { UserRole } from "@/lib/generated/prisma/client";

interface MobileNavProps {
  className?: string;
  userRole: UserRole | null | undefined;
}

export function MobileNav({ className, userRole }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild className={className}>
        <Button variant="outline">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="border-b">
          <SheetTitle>
            <Logo href="/dashboard" className="flex items-center" />
          </SheetTitle>
          <SheetDescription className="">
            You're currently on OpenStud{" "}
            <code className="bg-muted font-semibold px-2 rounded-full">
              v1.60-beta
            </code>
          </SheetDescription>
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5 py-0 mt-1 text-sm block relative -bottom-2 -rigth-4"
          >
            Free
          </Badge>
        </SheetHeader>

        <DashboardNav userRole={userRole} />

        <SheetFooter className="text-xs text-muted-foreground text-center">
          <Link href="/dashboard/billing" className="underline">
            Need unlimited access?
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
