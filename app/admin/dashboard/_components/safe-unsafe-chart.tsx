"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface SafeUnsafeChartProps {
  data: {
    label: string;
    safe: number;
    unsafe: number;
    date: string;
  }[];
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p
            key={index}
            className="text-xs font-medium"
            style={{ color: entry.color }}
          >
            {entry.dataKey === "safe" ? "Aman" : "Tidak Aman"}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SafeUnsafeChart({ data, className }: SafeUnsafeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-400">Belum ada data</p>
      </div>
    );
  }

  return (
    <div className={cn("h-[200px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          barSize={20}
          barGap={2}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend
            wrapperStyle={{ fontSize: "11px" }}
            formatter={(value) => (value === "safe" ? "Aman" : "Tidak Aman")}
          />
          <Bar
            dataKey="safe"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            name="safe"
          />
          <Bar
            dataKey="unsafe"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
            name="unsafe"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
