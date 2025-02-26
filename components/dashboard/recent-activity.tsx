"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const activities = [
  {
    id: 1,
    type: "assignment",
    title: "Math Assignment Submitted",
    description: "Linear Algebra - Chapter 5",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "grade",
    title: "New Grade Posted",
    description: "Physics Quiz 3: 92%",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "course",
    title: "Course Material Updated",
    description: "Chemistry Lab Manual",
    timestamp: "1 day ago",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest academic updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-lg p-3 transition-all hover:bg-muted/50"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
