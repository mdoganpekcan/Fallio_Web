"use client";

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function BarChart({
  data,
  color = "#7c5cff",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ReBarChart data={data} barSize={18} margin={{ top: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Bar dataKey="value" radius={[6, 6, 6, 6]} fill={color} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}
