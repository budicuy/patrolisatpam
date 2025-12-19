"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PatrolStatsChartProps {
  data: { name: string; patrols: number }[];
}

export function PatrolStatsChart({ data }: PatrolStatsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Belum ada data patroli.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickLine={{ stroke: "#e5e7eb" }}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 12 }}
          tickLine={{ stroke: "#e5e7eb" }}
          axisLine={{ stroke: "#e5e7eb" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
          labelStyle={{ fontWeight: "bold", color: "#111827" }}
          formatter={(value) => [`${value} patroli`, "Total"]}
        />
        <Bar
          dataKey="patrols"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          name="Jumlah Patroli"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
