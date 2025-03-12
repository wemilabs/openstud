"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecentActivity } from "@/actions/dashboard";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Clock,
  FileEdit,
  BarChart,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/tasks/progress-bar";
import { ScrollArea } from "../ui/scroll-area";
import { useWorkspace } from "@/contexts/workspace-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Activity type
interface Activity {
  id: string;
  type: "created" | "updated" | "completed" | "progress";
  description: string;
  date: Date;
  category?: string | null;
  projectName: string;
  taskTitle: string;
  completionPercentage: number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  isTeamActivity: boolean;
}

export function RecentActivity() {
  const { currentWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent activity data
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        setActivities([]);

        // Pass the current workspace ID to get workspace-specific data
        const result = await getRecentActivity(currentWorkspace.id);

        if (result.error) {
          setError(result.error);
          toast.error(`Error: ${result.error}`);
          return;
        }

        if (result.data && result.data.length > 0) {
          // Convert dates from strings to Date objects
          const formattedActivities = result.data.map((activity: any) => ({
            ...activity,
            date: new Date(activity.date),
          }));

          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        setError("Failed to fetch recent activity");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [currentWorkspace.id]); // Re-fetch when workspace changes

  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Get icon for activity type
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return <FileEdit className="size-4 text-blue-500" />;
      case "updated":
        return <BarChart className="size-4 text-orange-500" />;
      case "completed":
        return <CheckCircle className="size-4 text-green-500" />;
      case "progress":
        return <Clock className="size-4 text-yellow-500" />;
      default:
        return <BarChart className="size-4" />;
    }
  };

  // Get color for progress bar based on completion percentage
  const getProgressColor = (percentage: number) => {
    if (percentage < 25) return "bg-red-500";
    if (percentage < 50) return "bg-orange-500";
    if (percentage < 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null): string => {
    if (!name) return "?";

    // Split the name by spaces and get the first letter of each part
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    // First and last name initials
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest actions in{" "}
          {currentWorkspace.name === "Individual"
            ? "your personal workspace"
            : `the ${currentWorkspace.name} workspace`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] lg:h-[300px]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-muted-foreground">
                Error loading activity data
              </p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-8">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  {/* Show user avatar instead of icon when user info is available */}
                  {activity.user ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={activity.user.image || undefined}
                        alt={activity.user.name || "User"}
                      />
                      <AvatarFallback>
                        {getUserInitials(activity.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="mt-1">{getActivityIcon(activity.type)}</div>
                  )}

                  <div className="space-y-1 flex-1">
                    {/* Show who performed the action */}
                    {activity.isTeamActivity && activity.user && (
                      <p className="text-sm font-medium leading-none">
                        <span className="font-semibold">
                          {activity.user.name ||
                            activity.user.email?.split("@")[0] ||
                            "User"}
                        </span>{" "}
                        {activity.description}
                      </p>
                    )}

                    {/* For individual activities or when user info is not available */}
                    {(!activity.isTeamActivity || !activity.user) && (
                      <p className="text-sm font-medium leading-none">
                        {activity.description}
                      </p>
                    )}

                    <div className="flex items-center pt-2">
                      {activity.category && (
                        <Badge
                          variant="secondary"
                          className="mr-2 px-1 py-0 text-xs"
                        >
                          {activity.category}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                    {activity.type === "progress" && (
                      <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{activity.completionPercentage}%</span>
                        </div>
                        <ProgressBar
                          value={activity.completionPercentage}
                          indicatorClassName={getProgressColor(
                            activity.completionPercentage
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No recent activity to display
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentWorkspace.name === "Individual"
                  ? "Your activity will appear here as you work on tasks"
                  : `Activities in the ${currentWorkspace.name} workspace will appear here`}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
