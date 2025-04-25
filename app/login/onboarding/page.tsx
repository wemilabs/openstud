"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateUserRole } from "@/actions/user";
import { useSession } from "next-auth/react";

const roles = [
  {
    name: "Student",
    description: "Manage your courses, assignments, and study schedule.",
    value: "STUDENT",
  },
  {
    name: "Professor / Instructor",
    description: "Organize lectures, assignments, and track student progress.",
    value: "PROFESSOR",
  },
  {
    name: "Researcher",
    description:
      "Plan projects, track experiments, and collaborate on findings.",
    value: "RESEARCHER",
  },
  {
    name: "Supervisor",
    description:
      "Manage researcher projects, assign tasks, and provide feedback.",
    value: "SUPERVISOR",
  },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { data: session, update } = useSession();

  const handleRoleSelect = (roleValue: string) => {
    setSelectedRole(roleValue);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      console.error("Please select a role.");
      toast.error("Please select a role before continuing.");
      return;
    }

    startTransition(async () => {
      try {
        console.log(
          `[Onboarding] Attempting to update role to: ${selectedRole}`
        );
        const result = await updateUserRole(selectedRole);
        console.log("[Onboarding] Server action result:", result);

        if (result.success) {
          toast.success(
            "Role updated successfully! Updating session and redirecting..."
          );

          // Explicitly trigger session update
          await update({ role: selectedRole });
          console.log(
            "[Onboarding] Session update triggered. Refreshing and redirecting..."
          );

          router.refresh();
          // Add a small delay before pushing to allow refresh to potentially complete
          setTimeout(() => {
            router.push("/dashboard");
          }, 100);
        } else {
          toast.error(result.error || "Failed to update role.");
          console.error("[Onboarding] Role update failed:", result.error);
        }
      } catch (error) {
        console.error("[Onboarding] Error submitting role:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="container mx-auto flex h-screen flex-col items-center justify-center space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to OpenStud!
        </h1>
        <p className="text-muted-foreground">
          Tell us who you are to personalize your experience.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 px-4">
        {roles.map((role) => (
          <Card
            key={role.value}
            onClick={() => handleRoleSelect(role.value)}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedRole === role.value
                ? "border-primary ring-2 ring-primary ring-offset-2"
                : "border-border"
            )}
          >
            <CardHeader>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!selectedRole || isPending}
        size="lg"
      >
        {isPending ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
