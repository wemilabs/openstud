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

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
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
            You're currently using{" "}
            <code className="bg-muted font-semibold px-2 rounded-full">
              v0.17.4
            </code>{" "}
            of Openstud.
          </SheetDescription>
          <Badge
            variant="outline"
            className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md px-1.5 py-0 mt-1 text-sm block relative -bottom-2 -rigth-4"
          >
            Free
          </Badge>
        </SheetHeader>

        <DashboardNav />

        <SheetFooter className="text-xs text-muted-foreground text-center">
          <div>
            {/* Subscription renews in 12 days (Feb 11, - Mar 11, 2025) */}
            Access more features by{" "}
            <Link href="/dashboard/billing" className="underline">
              subscribing
            </Link>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
