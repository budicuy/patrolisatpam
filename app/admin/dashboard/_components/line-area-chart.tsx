"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

interface LineAreaChartProps {
  data: {
    label: string;
    value: number;
    date?: string;
  }[];
  color?: "teal" | "pink" | "blue" | "purple";
  className?: string;
}

const colorConfig = {
  teal: {
    stroke: "#14b8a6",
    fill: "url(#tealGradient)",
    dot: "#0d9488",
  },
  pink: {
    stroke: "#f472b6",
    fill: "url(#pinkGradient)",
    dot: "#ec4899",
  },
  blue: {
    stroke: "#3b82f6",
    fill: "url(#blueGradient)",
    dot: "#2563eb",
  },
  purple: {
    stroke: "#a855f7",
    fill: "url(#purpleGradient)",
    dot: "#9333ea",
  },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-bold text-gray-900">
          {payload[0].value} Patroli
        </p>
      </div>
    );
  }
  return null;
};

export function LineAreaChart({
  data,
  color = "teal",
  className,
}: LineAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
        <p className="text-sm font-medium text-gray-400">Belum ada data</p>
      </div>
    );
  }

  const config = colorConfig[color];

  return (
    <div className={cn("h-[180px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f472b6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={config.stroke}
            strokeWidth={2}
            fill={config.fill}
            dot={{ fill: config.dot, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: config.dot }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
