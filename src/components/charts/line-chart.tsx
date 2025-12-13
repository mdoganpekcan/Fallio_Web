"use client";

import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LineChart({
  data,
  color = "#7c5cff",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ReLineChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 10 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={{ r: 4, fill: color }}
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
}
