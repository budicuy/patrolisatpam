import { count } from "drizzle-orm";
import { History, MapPin, Users } from "lucide-react";
import { getPatrolStatsByUser } from "@/app/actions/stats";
import { db } from "@/lib/db";
import { locations, patrolHistory, users } from "@/lib/schema";
import { PatrolStatsChart } from "./_components/patrol-stats-chart";
import { UnpatrolledWarning } from "./_components/unpatrolled-warning";
import { StatCard } from "./_components/stat-card";
import { format } from "date-fns";
import { id } from "date-fns/locale";

async function getStats() {
  "use server";
  const [locationCount] = await db.select({ value: count() }).from(locations);
  const [userCount] = await db.select({ value: count() }).from(users);
  const [patrolCount] = await db.select({ value: count() }).from(patrolHistory);

  return {
    locations: locationCount.value,
    users: userCount.value,
    patrols: patrolCount.value,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const patrolStatsByUser = await getPatrolStatsByUser();
  const today = new Date();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview status patroli satpam hari ini, {format(today, "EEEE, d MMMM yyyy", { locale: id })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Lokasi"
          value={stats.locations}
          icon={MapPin}
          variant="blue"
          description="Titik patroli terdaftar"
        />
        <StatCard
          label="Total Petugas"
          value={stats.users}
          icon={Users}
          variant="green"
          description="Satpam aktif"
        />
        <StatCard
          label="Total Riwayat"
          value={stats.patrols}
          icon={History}
          variant="purple"
          description="Total aktivitas patroli"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Warning / Status Sidebar - Takes 2 columns (Wider than before) */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">
              Status Patroli Harian
            </h2>
            <div className="flex-1 min-h-0">
              <UnpatrolledWarning />
            </div>
          </div>
        </div>

        {/* Main Chart Area - Takes 3 columns (Smaller than before) */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              Statistik Keaktifan Petugas
            </h2>
            <div className="w-full flex-1 min-h-0">
              <PatrolStatsChart data={patrolStatsByUser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
