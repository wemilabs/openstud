import type { Metadata } from "next";
import "../globals.css";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardShell } from "@/components/dashboard/shell";
import { WorkspaceProvider } from "@/contexts/workspace-context";

export const metadata: Metadata = {
  title: "Dashboard - Openstud",
  description: "Manage your study process with ease using Openstud.",
};

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <WorkspaceProvider>
        <DashboardHeader />
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto md:sticky md:block">
            <DashboardNav />
          </aside>
          <main className="flex w-full flex-col overflow-hidden">
            <DashboardShell>{children}</DashboardShell>
          </main>
        </div>
      </WorkspaceProvider>
    </div>
  );
}
