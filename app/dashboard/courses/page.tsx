import { Suspense } from "react";
import { CreateCourse } from "@/components/courses/create-course";
import { CourseList } from "@/components/courses/course-list";
import { Pagination } from "@/components/courses/pagination";
import { getCourses } from "@/actions/courses";

export const metadata = {
  title: "Courses - OpenStud",
  description: "Create and manage your courses",
};

interface CoursesPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { page, search, sort } = await searchParams;
  const currentPage = Number(page) || 1;

  const { data, error } = await getCourses({
    page: currentPage,
    search,
    ...(sort
      ? {
          sortBy: sort.split(".")[0] as "name" | "createdAt",
          sortOrder: sort.split(".")[1] as "asc" | "desc",
        }
      : {}),
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Courses
          </h1>
          <h2 className="text-sm md:text-base text-muted-foreground">
            Add and manage courses.
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <CreateCourse />
        </div>
      </div>

      <Suspense fallback={<div>Loading courses...</div>}>
        <CourseList courses={data?.courses} />
        {data && data.pageCount > 1 && (
          <Pagination currentPage={currentPage} totalPages={data.pageCount} />
        )}
      </Suspense>
    </div>
  );
}
