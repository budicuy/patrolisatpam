import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    className?: string;
    variant?: "blue" | "green" | "purple" | "orange";
}

const variants = {
    blue: {
        bg: "bg-blue-50 border-blue-100",
        iconBg: "bg-blue-500",
        text: "text-blue-900",
        label: "text-blue-600",
    },
    green: {
        bg: "bg-green-50 border-green-100",
        iconBg: "bg-green-500",
        text: "text-green-900",
        label: "text-green-600",
    },
    purple: {
        bg: "bg-purple-50 border-purple-100",
        iconBg: "bg-purple-500",
        text: "text-purple-900",
        label: "text-purple-600",
    },
    orange: {
        bg: "bg-orange-50 border-orange-100",
        iconBg: "bg-orange-500",
        text: "text-orange-900",
        label: "text-orange-600",
    },
};

export function StatCard({
    label,
    value,
    icon: Icon,
    description,
    className,
    variant = "blue",
}: StatCardProps) {
    const styles = variants[variant];

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl p-6 shadow-sm transition-all hover:shadow-md border",
                styles.bg,
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className={cn("text-sm font-medium", styles.label)}>{label}</p>
                    <h3 className={cn("mt-4 text-4xl font-bold", styles.text)}>{value}</h3>
                    {description && (
                        <p className={cn("mt-1 text-xs opacity-80", styles.label)}>
                            {description}
                        </p>
                    )}
                </div>
                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm text-white",
                        styles.iconBg
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}
