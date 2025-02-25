"use client"

import { Course } from "@prisma/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { ErrorBoundary } from "@/components/error-boundary"
import { DeleteCourse } from "./delete-course"
import { EditCourse } from "./edit-course"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface CourseListProps {
  courses?: Pick<Course, "id" | "name" | "description" | "createdAt">[]
}

export function CourseList({ courses = [] }: CourseListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("sort", sort)
    router.push(`?${params.toString()}`)
  }

  if (courses.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h2 className="mt-6 text-xl font-semibold">No courses found</h2>
          <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
            {searchParams.get("search")
              ? "No courses match your search. Try a different term."
              : "You haven't created any courses yet. Start by creating your first course."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="mb-4 flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort by
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleSort("name.asc")}>
              Name (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("name.desc")}>
              Name (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("createdAt.desc")}>
              Newest first
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("createdAt.asc")}>
              Oldest first
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Created {formatDistanceToNow(course.createdAt)} ago
                </p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <EditCourse course={course} />
                <DeleteCourse courseId={course.id} courseName={course.name} />
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </ErrorBoundary>
  )
}
