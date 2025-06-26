import { Separator } from "@/components/ui/separator";

export default function TimetablePage() {
  return (
    <div className="container py-6 space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timetable</h1>
        <p className="font-mono text-sm text-muted-foreground mt-2">
          Follow up your timetable.
        </p>
      </div>

      <div className="space-y-6">
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Timetable management coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
