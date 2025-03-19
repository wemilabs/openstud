"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverviewChart } from "./overview-chart";
import { useWorkspace } from "@/contexts/workspace-context";

export function Overview() {
  const { currentWorkspace } = useWorkspace();

  // Determine title and description based on workspace type
  const isIndividual = currentWorkspace.id === "individual";
  const title = isIndividual
    ? "Personal Academic Progress"
    : `${currentWorkspace.name} Workspace Progress`;

  const description = isIndividual
    ? "Your individual performance overview for this semester"
    : `Collaborative performance overview for the ${currentWorkspace.name} workspace`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <OverviewChart />
      </CardContent>
    </Card>
  );
}
