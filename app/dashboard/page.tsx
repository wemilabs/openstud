import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <>
      <div className="grid gap-1">
        <h1 className="text-xl font-medium tracking-tight">
          🎊 Congratulations! You've got a place for studying.
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's an overview of your academic progress.
        </p>
      </div>
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
    </>
  );
}
