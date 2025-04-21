import { Suspense } from "react";
import Link from "next/link";
import { getCourseById } from "@/actions/courses";
import { getNotesByCourseId } from "@/actions/notes";
import { NoteList } from "@/components/notes/note-list";
import { CreateNote } from "@/components/notes/create-note";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Course Details - OpenStud",
  description: "View and manage your course details",
};

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;

  const { data: course, error } = await getCourseById(id);

  if (error || !course) {
    notFound();
  }

  const { data: notes = [] } = await getNotesByCourseId(course.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Courses
        </Link>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {course.name}
        </h1>
        {course.description && (
          <p className="mt-2 text-muted-foreground">{course.description}</p>
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Add and manage your course notes.
          </p>
        </div>
        <CreateNote courseId={course.id} className="md:mr-6" />
      </div>

      <Suspense fallback={<div>Loading notes...</div>}>
        <NoteList notes={notes} />
      </Suspense>
    </div>
  );
}
