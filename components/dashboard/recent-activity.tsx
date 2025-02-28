"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentActivity } from "@/actions/dashboard";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, FileEdit, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/tasks/progress-bar";

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
}

// Fallback data for when real data is not available
const fallbackActivities: Activity[] = [
  {
    id: "1",
    type: "created",
    description: "Created task 'Literature Review' in Environmental Biology",
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    category: "reading",
    projectName: "Environmental Biology",
    taskTitle: "Literature Review",
    completionPercentage: 0
  },
  {
    id: "2",
    type: "progress",
    description: "Updated progress to 50% on 'Math Assignment' in Calculus II",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    category: "assignment",
    projectName: "Calculus II",
    taskTitle: "Math Assignment",
    completionPercentage: 50
  },
  {
    id: "3",
    type: "completed",
    description: "Completed task 'Physics Lab Report' in Physics 101",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    category: "lab",
    projectName: "Physics 101",
    taskTitle: "Physics Lab Report",
    completionPercentage: 100
  }
];

/**
 * Recent activity component for the dashboard
 */
export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const result = await getRecentActivity();
        if (result.error) {
          console.error("Error fetching recent activity:", result.error);
          toast.error("Failed to load recent activity");
          // Use fallback data if there's an error
          setActivities(fallbackActivities);
        } else if (result.data && result.data.length > 0) {
          // Format the data
          const formattedActivities: Activity[] = result.data.map((activity: any) => ({
            ...activity,
            date: new Date(activity.date)
          }));
          setActivities(formattedActivities);
        } else {
          // Use fallback data if no real data is available
          setActivities(fallbackActivities);
        }
      } catch (error) {
        console.error("Error in fetchRecentActivity:", error);
        toast.error("Failed to load recent activity");
        // Use fallback data if there's an error
        setActivities(fallbackActivities);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  // Get icon based on activity type
  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "created":
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case "updated":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "progress":
        return <BarChart className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return "bg-gray-200 text-gray-700";
    
    switch (category.toLowerCase()) {
      case "assignment":
        return "bg-blue-100 text-blue-800";
      case "exam":
      case "quiz":
        return "bg-red-100 text-red-800";
      case "presentation":
        return "bg-purple-100 text-purple-800";
      case "lab":
        return "bg-green-100 text-green-800";
      case "reading":
        return "bg-yellow-100 text-yellow-800";
      case "project":
        return "bg-indigo-100 text-indigo-800";
      case "study":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        <CardDescription>Your latest academic updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-14 bg-muted animate-pulse rounded-md" />
            <div className="h-14 bg-muted animate-pulse rounded-md" />
            <div className="h-14 bg-muted animate-pulse rounded-md" />
          </div>
        ) : (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 rounded-md border p-3"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {activity.taskTitle}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.date, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.projectName}
                    </p>
                    {activity.category && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-normal",
                          getCategoryColor(activity.category)
                        )}
                      >
                        {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                      </Badge>
                    )}
                    {activity.type === "progress" && (
                      <div className="w-full mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{activity.completionPercentage}%</span>
                        </div>
                        <ProgressBar 
                          value={activity.completionPercentage} 
                          indicatorClassName={
                            activity.completionPercentage < 25 ? "bg-red-500" :
                            activity.completionPercentage < 50 ? "bg-orange-500" :
                            activity.completionPercentage < 75 ? "bg-yellow-500" :
                            "bg-green-500"
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
