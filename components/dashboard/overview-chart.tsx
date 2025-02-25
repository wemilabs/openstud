"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Math",
    total: 85,
  },
  {
    name: "Physics",
    total: 78,
  },
  {
    name: "Chemistry",
    total: 92,
  },
  {
    name: "Biology",
    total: 88,
  },
  {
    name: "English",
    total: 95,
  },
]

export function OverviewChart() {
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
        <Bar
          dataKey="total"
          radius={[6, 6, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
