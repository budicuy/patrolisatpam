"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  getAllDashboardData,
  getAvailableYears,
  getPatrolExportData,
} from "@/app/actions/analytics";
import { exportToExcel, exportToPdf } from "@/lib/export-utils";
import { DashboardFilters } from "./dashboard-filters";
import { LineAreaChart } from "./line-area-chart";
import { PatrolStatsChart } from "./patrol-stats-chart";
import { SafeUnsafeChart } from "./safe-unsafe-chart";
import { UnpatrolledWarning } from "./unpatrolled-warning";

interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

interface SafeUnsafePoint {
  label: string;
  safe: number;
  unsafe: number;
  date: string;
}

// Cache structure with timestamp for expiration
interface CachedData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
  safeUnsafe: SafeUnsafePoint[];
  userStats: { name: string; patrols: number }[];
  timestamp: number; // When the data was cached
}

// Cache expiration time: 5 minutes
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

export function DashboardClient() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([
    today.getFullYear(),
  ]);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [dailyData, setDailyData] = useState<ChartDataPoint[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartDataPoint[]>([]);
  const [safeUnsafeData, setSafeUnsafeData] = useState<SafeUnsafePoint[]>([]);
  const [userStats, setUserStats] = useState<
    { name: string; patrols: number }[]
  >([]);

  // Client-side cache with expiration
  const dataCache = useRef<Map<string, CachedData>>(new Map());

  // Force refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch available years on mount
  useEffect(() => {
    getAvailableYears().then((years) => {
      setAvailableYears(years);
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    });
  }, []);

  // Function to fetch data (used by effect and manual refresh)
  const fetchData = (forceRefresh = false) => {
    const cacheKey = `${selectedYear}-${selectedMonth}`;
    const now = Date.now();

    // Check if data is cached and not expired
    const cachedData = dataCache.current.get(cacheKey);
    const isExpired = cachedData && (now - cachedData.timestamp > CACHE_EXPIRATION_MS);

    if (cachedData && !isExpired && !forceRefresh) {
      // Use cached data immediately
      setDailyData(cachedData.daily);
      setWeeklyData(cachedData.weekly);
      setMonthlyData(cachedData.monthly);
      setSafeUnsafeData(cachedData.safeUnsafe);
      setUserStats(cachedData.userStats);
      return;
    }

    // Fetch fresh data
    startTransition(async () => {
      const data = await getAllDashboardData(selectedYear, selectedMonth);

      // Cache the fetched data with timestamp
      dataCache.current.set(cacheKey, {
        daily: data.daily,
        weekly: data.weekly,
        monthly: data.monthly,
        safeUnsafe: data.safeUnsafe,
        userStats: data.userStats,
        timestamp: Date.now(),
      });

      setDailyData(data.daily);
      setWeeklyData(data.weekly);
      setMonthlyData(data.monthly);
      setSafeUnsafeData(data.safeUnsafe);
      setUserStats(data.userStats);
    });
  };

  // Fetch all data on filter change - WITH CACHING & EXPIRATION
  useEffect(() => {
    fetchData(refreshTrigger > 0);
  }, [selectedMonth, selectedYear, refreshTrigger]);

  // Force refresh handler - clears cache and fetches fresh data
  const handleRefreshData = () => {
    // Clear cache for current selection
    const cacheKey = `${selectedYear}-${selectedMonth}`;
    dataCache.current.delete(cacheKey);

    // Trigger re-fetch
    setRefreshTrigger((prev) => prev + 1);
    toast.success("Data diperbarui!");
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const data = await getPatrolExportData(selectedYear, selectedMonth);
      exportToExcel(data, `riwayat-patroli-${selectedYear}-${selectedMonth}`);
      toast.success("Berhasil export ke Excel!");
    } catch (error) {
      toast.error("Gagal export ke Excel");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const data = await getPatrolExportData(selectedYear, selectedMonth);
      const monthName = new Date(
        selectedYear,
        selectedMonth - 1,
      ).toLocaleString("id-ID", { month: "long" });
      exportToPdf(data, `laporan-patroli-${monthName}-${selectedYear}`, {
        start: `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-01`,
        end: `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-31`,
      });
      toast.success("Berhasil export ke PDF!");
    } catch (error) {
      toast.error("Gagal export ke PDF");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString(
    "id-ID",
    { month: "long" },
  );

  return (
    <div className="space-y-6">
      {/* Unified Filters */}
      <DashboardFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        onRefresh={handleRefreshData}
        isExporting={isExporting}
        isPending={isPending}
      />

      {/* 4-Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Patroli Harian ({monthName} {selectedYear})
              </h2>
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Harian
            </span>
          </div>
          {isPending ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
            </div>
          ) : (
            <LineAreaChart data={dailyData} color="teal" />
          )}
        </div>

        {/* Weekly Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-pink-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Patroli Mingguan (Bulan {monthName})
              </h2>
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Mingguan
            </span>
          </div>
          {isPending ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600" />
            </div>
          ) : (
            <LineAreaChart data={weeklyData} color="pink" />
          )}
        </div>

        {/* Monthly Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Patroli Bulanan ({selectedYear})
              </h2>
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Bulanan
            </span>
          </div>
          {isPending ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <LineAreaChart data={monthlyData} color="blue" />
          )}
        </div>

        {/* Safe/Unsafe Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Riwayat Aman/Tidak Aman ({selectedYear})
              </h2>
            </div>
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Bulanan
            </span>
          </div>
          {isPending ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : (
            <SafeUnsafeChart data={safeUnsafeData} />
          )}
        </div>
      </div>

      {/* Status + User Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Status Patroli Harian */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-full flex flex-col">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              Status Patroli Harian
            </h2>
            <div className="flex-1 min-h-0">
              <UnpatrolledWarning />
            </div>
          </div>
        </div>

        {/* Statistik Keaktifan Petugas */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Statistik Keaktifan Petugas
              </h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {monthName} {selectedYear}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              {isPending ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : (
                <PatrolStatsChart data={userStats} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
