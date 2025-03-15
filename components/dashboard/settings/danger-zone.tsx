"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resetUserData, deleteAccount } from "@/actions/user";

type DangerAction = {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  confirmText: string;
  action: () => Promise<void>;
};

/**
 * DangerZone component displays critical account actions that require confirmation
 * Each action is displayed as a card with a confirmation dialog
 */
export function DangerZone() {
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({});

  // Handle action with loading state
  const handleAction = async (
    action: () => Promise<void>,
    actionKey: string
  ) => {
    setIsLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      await action();
    } catch (error) {
      console.error("Action failed:", error);
      toast.error("The action failed to complete. Please try again.");
    } finally {
      setIsLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  // Define dangerous actions
  const dangerActions: DangerAction[] = [
    {
      title: "Remove All Integrations",
      description:
        "Disconnect all third-party integrations and services connected to your account.",
      icon: <Icons.unlink className="size-5 text-orange-500" />,
      buttonText: "Remove Integrations",
      confirmText: "Yes, remove all integrations",
      action: async () => {
        // Implementation would call an API endpoint to remove integrations
        console.log("Integration removal requested");
        toast.info(
          "Coming Soon: Integration removal will be available in a future update."
        );
        // await removeAllIntegrations();
      },
    },
    {
      title: "Delete Project History",
      description:
        "Permanently delete the history and analytics for all your projects.",
      icon: <Icons.fileX className="size-5 text-rose-500" />,
      buttonText: "Delete History",
      confirmText: "Yes, delete history",
      action: async () => {
        // Implementation would call an API endpoint to delete project history
        console.log("Project history deletion requested");
        toast.info(
          "Coming Soon: Project history deletion will be available in a future update."
        );
        // await deleteProjectHistory();
      },
    },
    {
      title: "Reset All Data",
      description:
        "Clear all your tasks, projects, and settings while keeping your account. This action cannot be undone.",
      icon: <Icons.refreshCw className="size-5 text-amber-500" />,
      buttonText: "Reset Data",
      confirmText: "Yes, reset all data",
      action: async () => {
        const result = await resetUserData();

        if (result.success) {
          toast.success(
            result.message || "Your data has been reset successfully."
          );
          window.location.href = "/dashboard";
        } else {
          toast.error(
            result.error || "Failed to reset your data. Please try again."
          );
        }
      },
    },

    {
      title: "Delete Account",
      description:
        "Permanently delete your account and all associated data. This action cannot be undone.",
      icon: <Icons.trash2 className="size-5 text-red-500" />,
      buttonText: "Delete Account",
      confirmText: "Yes, delete my account",
      action: async () => {
        const result = await deleteAccount();

        if (result.success) {
          toast.success(
            result.message || "Your account has been permanently deleted."
          );
          window.location.href = "/";
        } else {
          toast.error(
            result.error || "Failed to delete your account. Please try again."
          );
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-red-600 dark:text-red-500">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          These actions have serious consequences and cannot be undone.
        </p>
      </div>
      <div className="grid gap-4">
        {dangerActions.map((action, index) => (
          <Card key={index} className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                {action.icon}
                <CardTitle className="text-base">{action.title}</CardTitle>
              </div>
              <CardDescription className="text-sm">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={isLoading[action.title]}
                  >
                    {isLoading[action.title] ? (
                      <div className="flex items-center gap-2">
                        <Icons.spinner className="size-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      action.buttonText
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently affect
                      your account and associated data according to the selected
                      action.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-muted dark:text-primary hover:bg-destructive/90"
                      onClick={() => handleAction(action.action, action.title)}
                    >
                      {action.confirmText}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
