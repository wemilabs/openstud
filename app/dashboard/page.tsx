import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WorkspaceContent } from "@/components/dashboard/workspace-content";

export default function DashboardPage() {
  return (
    <>
      <div className="grid gap-1 mb-4">
        <h1 className="text-xl font-medium tracking-tight">
          Welcome to OpenStud
        </h1>
        <p className="text-sm text-muted-foreground">
          Your collaborative space for academic success
        </p>
      </div>
      
      {/* Overview and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-12 mb-6">
        {/* Overview section */}
        <div className="col-span-full md:col-span-5 lg:col-span-8">
          <Overview />
        </div>

        {/* Recent Activity */}
        <div className="col-span-full md:col-span-2 lg:col-span-4">
          <RecentActivity />
        </div>
      </div>
      
      {/* Workspace-specific content */}
      <WorkspaceContent />
    </>
  );
}
