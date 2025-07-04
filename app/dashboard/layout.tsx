import type { Metadata } from "next";
import "../globals.css";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { WorkspaceProvider } from "@/contexts/workspace-context";
import { getCurrentUserRole } from "@/lib/auth/utils";

export const metadata: Metadata = {
  title: "Dashboard - Openstud",
  description: "Manage your study process with ease using Openstud.",
  keywords: ["openstud", "dashboard", "study process", "full management"],
};

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const userRole = await getCurrentUserRole();
  return (
    <div className="relative flex min-h-screen flex-col">
      <WorkspaceProvider>
        <DashboardHeader userRole={userRole} />
        <div className="flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden md:block">
            <div className="fixed top-14 z-30 w-[220px] lg:w-[240px] h-[calc(100vh-3.5rem)] overflow-y-auto">
              <DashboardNav userRole={userRole} />
            </div>
          </aside>
          <main className="flex flex-col overflow-hidden">
            <DashboardShell>{children}</DashboardShell>
          </main>
        </div>
      </WorkspaceProvider>
    </div>
  );
}
