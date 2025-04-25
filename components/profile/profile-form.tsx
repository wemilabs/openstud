"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { Icons } from "../icons";
import type { UserRole } from "@/generated/prisma/client";

interface ProfileFormProps {
  username: string | null | undefined;
  bio: string | null | undefined;
  email: string | null | undefined;
  school: string | null | undefined;
  studentId: string | null | undefined;
  schoolEmail: string | null | undefined;
  role: UserRole | null | undefined;
}

export function ProfileForm({
  username,
  role,
  email,
  school,
  studentId,
  schoolEmail,
  bio,
}: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const clientAction = async (formData: FormData) => {
    startTransition(async () => {
      const formUsername = formData.get("username") as string;
      const formBio = formData.get("bio") as string;
      const formSchool = formData.get("school") as string;
      const formStudentId = formData.get("studentId") as string;
      const formSchoolEmail = formData.get("schoolEmail") as string;

      try {
        const result = await updateProfile({
          username: formUsername || undefined,
          bio: formBio || undefined,
          school: formSchool || undefined,
          studentId: formStudentId || undefined,
          schoolEmail: formSchoolEmail || undefined,
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
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            placeholder="Enter your role"
            defaultValue={role || ""}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Your role is managed by your authentication provider. Contact the
            administrator for role changes.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Input
            id="school"
            name="school"
            placeholder="Enter your school name"
            defaultValue={school || ""}
          />
          <p className="text-xs text-muted-foreground">
            Your school must be 3-100 characters.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentId">Student ID</Label>
          <Input
            id="studentId"
            name="studentId"
            placeholder="Enter your student ID"
            defaultValue={studentId || ""}
          />
          <p className="text-xs text-muted-foreground">
            Your student ID must be 3-100 characters, depending on your school's
            requirements.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schoolEmail">School Email (Optional)</Label>
          <Input
            id="schoolEmail"
            name="schoolEmail"
            type="email"
            placeholder="Enter your school email"
            defaultValue={schoolEmail || ""}
          />
          <p className="text-xs text-muted-foreground">
            Your school email address is managed by your school administrator.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Personal Email</Label>
          <Input id="email" name="email" defaultValue={email || ""} disabled />
          <p className="text-xs text-muted-foreground">
            Your personal email address is managed by your authentication
            provider.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell us about yourself"
            defaultValue={bio || ""}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Your bio must be 10-1000 characters.
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-8">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Icons.spinner className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardFooter>
    </form>
  );
}
