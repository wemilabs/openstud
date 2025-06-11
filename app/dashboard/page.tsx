import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WorkspaceContent } from "@/components/dashboard/workspace-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return redirect("/login");
  }

  return (
    <>
      <div className="grid gap-1 mb-4">
        <h1 className="text-xl font-medium tracking-tight">
          🎉 Hey, you're welcome dear{" "}
          <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {session?.user?.role?.toLocaleLowerCase()}
          </span>
          .
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's your space for academic success.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-12 mb-6">
        <div className="col-span-full md:col-span-5 lg:col-span-8">
          <Overview />
        </div>
        <div className="col-span-full md:col-span-5 lg:col-span-4">
          <RecentActivity />
        </div>
      </div>

      <WorkspaceContent />
    </>
  );
}
