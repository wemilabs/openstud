"use client";

import { useEffect, useState } from "react";
import { getRecentActivity } from "@/actions/dashboard";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";
import Image from "next/image";
import { ScrollArea } from "../ui/scroll-area";
import { ClockIcon } from "lucide-react";

// Helper to get category configuration
const getTaskCategoryConfig = (category: string) => {
  const configs: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    assignment: { label: "Assignment", color: "#3b82f6", icon: "📝" },
    "exam-quiz": { label: "Exam/Quiz", color: "#ef4444", icon: "📄" },
    presentation: { label: "Presentation", color: "#8b5cf6", icon: "🎭" },
    "lab-work": { label: "Lab Work", color: "#10b981", icon: "🧪" },
    reading: { label: "Reading", color: "#f59e0b", icon: "📚" },
    project: { label: "Project", color: "#6366f1", icon: "🛠️" },
    "study-session": { label: "Study", color: "#ec4899", icon: "📖" },
    other: { label: "Other", color: "#6b7280", icon: "📌" },
  };

  return configs[category] || { label: category, color: "#6b7280", icon: "📌" };
};

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface ActivityItem {
  id: string;
  type: "created" | "updated" | "completed" | "progress";
  description: string;
  date: Date;
  category?: string | null;
  projectName: string;
  taskTitle: string;
  completionPercentage?: number;
  user: User | null;
  isTeamActivity: boolean;
  isCurrentUserAction?: boolean;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({
  activities: propActivities,
  isLoading: propLoading,
}: RecentActivityProps) {
  const { currentWorkspace } = useWorkspace();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent activities for the current workspace
  useEffect(() => {
    const fetchActivities = async () => {
      if (!currentWorkspace) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getRecentActivity(currentWorkspace.id);

        if (result.error) {
          setError(result.error);
          setActivities([]);
        } else {
          console.log("Activity data received:", result.data);
          setActivities(result.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError("Failed to load recent activities");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    // If activities are provided as props, use those instead of fetching
    if (propActivities) {
      setActivities(propActivities);
      setLoading(false);
    } else {
      fetchActivities();
    }
  }, [currentWorkspace?.id, propActivities, currentWorkspace]);

  useEffect(() => {
    if (activities.length > 0) {
      console.log(
        "Activity debug data:",
        activities.map((a) => ({
          id: a.id,
          hasUser: !!a.user,
          userId: a.user?.id,
          userName: a.user?.name,
          description: a.description,
        }))
      );
    }
  }, [activities]);

  const getIconForActivityType = (type: string) => {
    switch (type) {
      case "created":
        return "✨";
      case "updated":
        return "🔄";
      case "completed":
        return "✅";
      case "progress":
        return "📈";
      default:
        return "📝";
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = (user: User | null) => {
    if (!user) return "Unknown User";

    // Check for name first
    if (user.name && typeof user.name === "string" && user.name.trim() !== "") {
      return user.name;
    }

    // Fallback to email
    if (
      user.email &&
      typeof user.email === "string" &&
      user.email.includes("@")
    ) {
      // Return part before @ in the email
      return user.email.split("@")[0];
    }

    // If we have an ID but no name/email
    if (user.id) {
      return "User " + user.id.substring(0, 4);
    }

    return "Unknown User";
  };

  // Determine if we should show loading state
  const showLoading = propLoading !== undefined ? propLoading : loading;

  // Placeholder for error state
  if (error) {
    return (
      <Card className="h-[350px] lg:h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions in{" "}
            {currentWorkspace?.name === "Individual"
              ? "your personal workspace"
              : `the ${currentWorkspace?.name} workspace`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-full">
          <div className="rounded-full bg-red-100 p-3 mb-4">
            <ClockIcon className="h-10 w-10 text-red-500" />
          </div>
          <p className="text-muted-foreground">Error loading activities</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }
  // Placeholder for empty state
  if (!showLoading && (!activities || activities.length === 0)) {
    return (
      <Card className="h-[350px] lg:h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions in{" "}
            {currentWorkspace?.name === "Individual"
              ? "your personal workspace"
              : `the ${currentWorkspace?.name} workspace`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center h-full">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-muted-foreground">No recent activity</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Your recent actions will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[350px] lg:h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest actions in{" "}
          {currentWorkspace?.name === "Individual"
            ? "your personal workspace"
            : `the ${currentWorkspace?.name} workspace`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[220px] lg:h-[300px]">
          {showLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                console.log(
                  "Rendering activity:",
                  activity.id,
                  "User:",
                  activity.user
                );

                const categoryConfig = activity.category
                  ? getTaskCategoryConfig(activity.category)
                  : null;

                return (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="rounded-full bg-muted flex items-center justify-center h-8 w-8 overflow-hidden">
                      {activity.user && activity.user.image ? (
                        <Image
                          src={activity.user.image}
                          alt={getUserDisplayName(activity.user)}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full bg-primary/10 text-primary">
                          {activity.user && activity.user.name
                            ? activity.user.name.charAt(0).toUpperCase()
                            : getIconForActivityType(activity.type)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          <strong className="text-primary mr-1">
                            {activity.user && activity.user.name
                              ? activity.user.name
                              : activity.user && activity.user.email
                              ? activity.user.email.split("@")[0]
                              : "User"}
                          </strong>
                          {activity.description}
                        </p>
                        <div className="flex items-center">
                          {categoryConfig && (
                            <Badge
                              variant="outline"
                              className="ml-2 px-1.5 text-xs"
                              style={{
                                backgroundColor: `${categoryConfig.color}10`,
                                color: categoryConfig.color,
                                borderColor: `${categoryConfig.color}30`,
                              }}
                            >
                              {categoryConfig.icon} {categoryConfig.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(activity.date), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
