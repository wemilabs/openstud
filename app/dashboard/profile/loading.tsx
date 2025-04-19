import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Loading() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Skeleton className="size-24 rounded-full" />
            </div>
            <Skeleton className="h-4" />
            <Skeleton className="h-3" />
          </CardHeader>
          <CardContent className="text-center">
            <Skeleton className="h-4" />
            <Skeleton className="h-2" />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Update Profile</CardTitle>
            <CardDescription>Manage your profile settings.</CardDescription>
          </CardHeader>
          <div className="text-center space-y-2 px-6">
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[20%]" />
          </div>
        </Card>
      </div>
    </div>
  );
}
