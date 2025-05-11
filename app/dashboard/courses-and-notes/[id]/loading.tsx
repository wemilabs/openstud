import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="w-40 h-8" />
      </div>

      <div>
        <Skeleton className="w-3/4 h-8" />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Add and manage your course notes.
          </p>
        </div>
        <Skeleton className="w-28 h-8 md:mr-6" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:pr-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            className="group relative overflow-hidden transition-all hover:shadow-md"
          >
            <CardHeader>
              <div className="space-y-3">
                <Skeleton className="w-[90%] h-7" />
                <Skeleton className="w-3/4 h-7" />
              </div>
            </CardHeader>

            <CardContent>
              <Skeleton className="w-full h-7" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
