"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardFiltersProps {
    selectedMonth: number;
    selectedYear: number;
    availableYears: number[];
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    onExportExcel: () => void;
    onExportPdf: () => void;
    isExporting?: boolean;
}

const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
];

export function DashboardFilters({
    selectedMonth,
    selectedYear,
    availableYears,
    onMonthChange,
    onYearChange,
    onExportExcel,
    onExportPdf,
    isExporting = false,
}: DashboardFiltersProps) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Month and Year Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Bulan:</span>
                        <select
                            value={selectedMonth}
                            onChange={(e) => onMonthChange(Number(e.target.value))}
                            className="h-9 px-3 text-sm font-medium rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {months.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Tahun:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => onYearChange(Number(e.target.value))}
                            className="h-9 px-3 text-sm font-medium rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {availableYears.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 hidden sm:block">
                        {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportExcel}
                        disabled={isExporting}
                        className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Excel
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExportPdf}
                        disabled={isExporting}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                </div>
            </div>
        </div>
    );
}
