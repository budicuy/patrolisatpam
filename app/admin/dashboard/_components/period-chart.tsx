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
import { cn } from "@/lib/utils";

interface PeriodChartProps {
    data: {
        label: string;
        patrols: number;
        date: string;
    }[];
    className?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
                <p className="mb-1 text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs font-medium text-blue-600">
                    {payload[0].value} Patroli
                </p>
            </div>
        );
    }
    return null;
};

export function PeriodChart({ data, className }: PeriodChartProps) {
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
                    barSize={30}
                >
                    <defs>
                        <linearGradient id="periodBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                    <Bar
                        dataKey="patrols"
                        fill="url(#periodBarGradient)"
                        radius={[6, 6, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
