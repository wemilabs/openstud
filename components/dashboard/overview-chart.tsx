"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  TooltipProps,
} from "recharts";
import { getTaskStatsByCategory } from "@/lib/actions/dashboard";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/workspace-context";
import { BarChart as BarChartIcon } from "lucide-react";

interface ChartData {
  name: string;
  total: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string> & {
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
  }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md text-foreground">
        <p className="font-medium">{label}</p>
        <p className="text-sm">
          <span className="text-primary font-medium">{payload[0].value}%</span>{" "}
          avg. completion
        </p>
      </div>
    );
  }

  return null;
};

export function OverviewChart() {
  const { currentWorkspace } = useWorkspace();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setData([]);

        const result = await getTaskStatsByCategory(currentWorkspace.id);

        if (result.error) {
          setError(result.error);
          toast.error(`Error: ${result.error}`);
          return;
        }

        if (result.data && result.data.length > 0) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch task statistics:", error);
        setError("Failed to fetch task statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentWorkspace.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[350px]">
        <div className="w-full max-w-md space-y-4">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4 mx-auto" />
          <div className="h-[200px] bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-center">
        <div className="rounded-full bg-red-100 p-3 mb-4">
          <BarChartIcon className="h-10 w-10 text-red-500" />
        </div>
        <p className="text-muted-foreground">Error loading statistics</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <BarChartIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No task statistics available</p>
        <p className="text-xs text-muted-foreground mt-1">
          {currentWorkspace.name === "Individual"
            ? "Create and update tasks to see your statistics"
            : `Create and update tasks in the ${currentWorkspace.name} workspace to see statistics`}
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[10, 10, 0, 0]}
          className="fill-[#155DFC]"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
