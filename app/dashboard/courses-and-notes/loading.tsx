import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

export default async function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Courses
          </h1>
          <h2 className="text-sm md:text-base text-muted-foreground">
            Add and manage courses. Click on a course title to view your notes.
          </h2>
        </div>
        <div className="flex items-center">
          <Skeleton className="w-28 h-9 rounded-md md:mr-6" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="md:w-[38%] w-[87%] h-9 rounded-md" />
        <Skeleton className="size-9 rounded-md md:mr-6" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            className="group relative overflow-hidden transition-all hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="size-6" />
                <Skeleton className="w-[90%] h-6" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2">
                <Skeleton className="size-4" />
                <Skeleton className="w-3/4 h-4" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-5 w-28" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
