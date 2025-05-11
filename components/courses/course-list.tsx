"use client";

import { Course } from "@/generated/prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ErrorBoundary } from "@/components/error-boundary";
import { DeleteCourse } from "./delete-course";
import { EditCourse } from "./edit-course";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Book, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CourseSearch } from "./course-search";
import Link from "next/link";

interface CourseListProps {
  courses?: (Pick<Course, "id" | "name" | "description" | "createdAt"> & {
    _count: {
      notes: number;
    };
  })[];
}

export function CourseList({ courses = [] }: CourseListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    router.push(`?${params.toString()}`);
  };

  if (courses.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between gap-x-4 -mb-4">
          <CourseSearch />
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:mr-6">
              <Button variant="outline" size="sm">
                <ArrowUpDown className="size-4" />
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
      </>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex items-center justify-between gap-x-4 -mb-4">
        <CourseSearch />
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:mr-6">
            <Button variant="outline" size="sm">
              <ArrowUpDown className="size-4" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:pr-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="group relative overflow-hidden transition-all hover:shadow-md"
            >
              <div className="absolute right-2 top-2 flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                <EditCourse course={course} />
                <DeleteCourse courseId={course.id} courseName={course.name} />
              </div>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Book className="size-4 text-muted-foreground" />
                  <Link href={`/dashboard/courses-and-notes/${course.id}`}>
                    <CardTitle className="line-clamp-1 text-base">
                      {course.name}
                    </CardTitle>
                  </Link>
                </div>
                {course.description && (
                  <CardDescription className="line-clamp-2 mt-2.5">
                    {course.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>
                    Created {formatDistanceToNow(course.createdAt)} ago
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                >
                  {course._count.notes} Note{course._count.notes > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline">No assignments</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </ErrorBoundary>
  );
}
