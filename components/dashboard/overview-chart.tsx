"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getTaskStatsByCategory } from "@/actions/dashboard";
import { toast } from "sonner";

// Fallback data in case there's no real data yet
const fallbackData = [
  {
    name: "Assignment",
    total: 85,
  },
  {
    name: "Exam",
    total: 78,
  },
  {
    name: "Presentation",
    total: 92,
  },
  {
    name: "Reading",
    total: 88,
  },
  {
    name: "Project",
    total: 95,
  },
];

export function OverviewChart() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getTaskStatsByCategory();
        
        if (result.error) {
          toast.error(`Error: ${result.error}`);
          return;
        }
        
        if (result.data && result.data.length > 0) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch task statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

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
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            boxShadow: "var(--shadow)",
          }}
          labelStyle={{ color: "var(--foreground)" }}
        />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} className="fill-[#155DFC]" />
      </BarChart>
    </ResponsiveContainer>
  );
}
