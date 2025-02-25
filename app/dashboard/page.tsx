import { DashboardWelcome } from "@/components/dashboard/welcome";
import { DashboardShell } from "@/components/dashboard/shell";
import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardWelcome
        heading="Dashboard"
        text="Welcome back! Here's an overview of your academic progress."
      />
      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-12">
        {/* Overview section */}
        <div className="col-span-full md:col-span-5 lg:col-span-8">
          <Overview />
        </div>

        {/* Recent Activity */}
        <div className="col-span-full md:col-span-2 lg:col-span-4">
          <RecentActivity />
        </div>
      </div>
    </DashboardShell>
  );
}
