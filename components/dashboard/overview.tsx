import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverviewChart } from "./overview-chart";

export function Overview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Progress</CardTitle>
        <CardDescription>
          Your performance overview for this semester
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <OverviewChart />
      </CardContent>
    </Card>
  );
}
