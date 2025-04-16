import { Separator } from "@/components/ui/separator";

export default function ProgressPage() {
  return (
    <div className="container py-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-2">
          Get relevant insights into your performance.
        </p>
      </div>

      <div className="space-y-6">
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Progress and analytics coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
