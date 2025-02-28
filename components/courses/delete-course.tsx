"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCourse } from "@/actions/courses";

interface DeleteCourseProps {
  courseId: string;
  courseName: string;
}

export function DeleteCourse({ courseId, courseName }: DeleteCourseProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  async function onDelete() {
    try {
      setIsLoading(true);
      const result = await deleteCourse(courseId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Course deleted successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 bg-destructive text-muted hover:text-muted dark:text-primary hover:bg-destructive/90 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete course</span>
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the course &quot;{courseName}&quot; and
            all of its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isLoading}
            className="bg-destructive text-muted dark:text-primary hover:bg-destructive/90 cursor-pointer"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
