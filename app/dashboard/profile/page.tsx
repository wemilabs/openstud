import { requireAuth } from "@/lib/auth/auth-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUserPlan } from "@/lib/auth/auth-utils";
import { ProfileForm } from "@/components/profile/profile-form";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireAuth();
  const plan = (await getUserPlan()) || "FREE";

  const dbUser = user.email
    ? await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          username: true,
          bio: true,
          school: true,
          studentId: true,
          schoolEmail: true,
          createdAt: true,
        },
      })
    : null;

  const displayName = user.name || "";
  const username = dbUser?.username || "";
  const bio = dbUser?.bio || "";
  const school = dbUser?.school || "";
  const studentId = dbUser?.studentId || "";
  const schoolEmail = dbUser?.schoolEmail || "";

  const formattedPlan = plan.charAt(0) + plan.slice(1).toLowerCase();

  const joinedDate = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="size-24">
                <AvatarImage
                  src={user.image || ""}
                  alt={username || displayName}
                />
                <AvatarFallback className="text-xl">
                  {username
                    ? username.slice(0, 2).toUpperCase()
                    : displayName.slice(0, 2).toUpperCase() ||
                      user.email?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{username || displayName || "Set username"}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge>{formattedPlan} Plan</Badge>
            <p className="mt-4 text-sm text-muted-foreground">
              Joined {joinedDate}
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Manage your profile settings.</CardDescription>
          </CardHeader>
          <ProfileForm
            username={username}
            email={user.email}
            bio={bio}
            school={school}
            studentId={studentId}
            schoolEmail={schoolEmail}
          />
        </Card>
      </div>
    </div>
  );
}
