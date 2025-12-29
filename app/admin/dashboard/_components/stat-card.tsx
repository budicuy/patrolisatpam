import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    className?: string; // Additional classes for the card
    iconClassName?: string; // Classes for the icon container
}

export function StatCard({
    label,
    value,
    icon: Icon,
    description,
    className,
    iconClassName,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md",
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
                    {description && (
                        <p className="mt-1 text-xs text-gray-500">{description}</p>
                    )}
                </div>
                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50",
                        iconClassName
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>

            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-current opacity-[0.03] blur-2xl" />
        </div>
    );
}
