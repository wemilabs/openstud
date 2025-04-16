import { Separator } from "@/components/ui/separator";

export default function BillingPage() {
  return (
    <div className="container py-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-2">
          Manage your billing and subscription.
        </p>
      </div>

      <div className="space-y-6">
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Billing management coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
