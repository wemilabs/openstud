import { Separator } from "@/components/ui/separator";
import { DangerZone } from "@/components/dashboard/settings/danger-zone";

export default async function SettingsPage() {
  return (
    <div className="container py-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Preferences Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preferences</h2>
          <p className="text-muted-foreground mt-1">
            Manage your personal preferences.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Timezone and Language preferences coming soon
          </p>
        </div>
      </div>

      {/* Academic Settings */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Academic Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure your academic profile and preferences.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">Academic settings coming soon</p>
        </div>
      </div>

      {/* Task Management Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Management</h2>
          <p className="text-muted-foreground mt-1">
            Customize how you manage and view your tasks.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Task management settings coming soon
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground mt-1">
            Control when and how you receive notifications.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Notification settings coming soon
          </p>
        </div>
      </div>

      {/* Integrations */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground mt-1">
            Connect and manage third-party services.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Integration settings coming soon
          </p>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data & Privacy</h2>
          <p className="text-muted-foreground mt-1">
            Manage your data and privacy settings.
          </p>
        </div>
        <Separator />
        <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-center h-48">
          <p className="text-muted-foreground">
            Data and privacy settings coming soon
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-6">
        <Separator className="bg-red-200 dark:bg-red-900" />
        <DangerZone />
      </div>
    </div>
  );
}
