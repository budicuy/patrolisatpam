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
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="font-medium">Belum ada data patroli</p>
        <p className="text-sm text-gray-400">Data akan muncul setelah aktifitas dimulai</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            dx={-10}
          />
          <Tooltip
            cursor={{ fill: "#f9fafb" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "none",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
              padding: "12px 16px",
            }}
            itemStyle={{ color: "#374151", fontSize: "14px", fontWeight: "600" }}
            labelStyle={{ color: "#9ca3af", fontSize: "12px", marginBottom: "4px" }}
            formatter={(value) => [`${value} Patroli`, "Total"]}
          />
          <Bar
            dataKey="patrols"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
