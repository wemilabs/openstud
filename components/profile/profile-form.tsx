"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  username: string | null | undefined;
  email: string | null | undefined;
}

export function ProfileForm({ username, email }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  // Server action wrapper for client-side feedback
  const clientAction = async (formData: FormData) => {
    startTransition(async () => {
      const formUsername = formData.get("username") as string;

      try {
        const result = await updateProfile({
          username: formUsername || undefined,
        });

        if (result.success) {
          toast.success("Profile updated successfully");
        } else {
          toast.error(result.error || "Failed to update profile");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        toast.error("An error occurred while updating your profile");
      }
    });
  };

  return (
    <form action={clientAction}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Choose a username"
            defaultValue={username || ""}
          />
          <p className="text-xs text-muted-foreground">
            Your username must be 3-30 characters and can only include letters,
            numbers, underscores, and hyphens.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            defaultValue={email || ""}
            disabled
            // className="cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Your email address is managed by your authentication provider.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </form>
  );
}
