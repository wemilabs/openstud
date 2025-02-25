"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
    user: {
      name: "John D.",
      image: "/avatars/01.png",
    },
  },
  {
    id: 2,
    type: "grade",
    title: "New Grade Posted",
    description: "Physics Quiz 3: 92%",
    timestamp: "5 hours ago",
    user: {
      name: "Sarah M.",
      image: "/avatars/02.png",
    },
  },
  {
    id: 3,
    type: "course",
    title: "Course Material Updated",
    description: "Chemistry Lab Manual",
    timestamp: "1 day ago",
    user: {
      name: "Prof. Smith",
      image: "/avatars/03.png",
    },
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
        <div className="space-y-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-4 rounded-lg p-3 transition-all hover:bg-muted/50"
            >
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={activity.user.image} alt="Avatar" />
                <AvatarFallback>
                  {activity.user.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground/75">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
