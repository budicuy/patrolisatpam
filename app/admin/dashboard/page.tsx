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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Overview status patroli satpam hari ini, {format(today, "EEEE, d MMMM yyyy", { locale: id })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Lokasi"
          value={stats.locations}
          icon={MapPin}
          iconClassName="bg-blue-100 text-blue-600"
          className="border-blue-100"
          description="Titik patroli terdaftar"
        />
        <StatCard
          label="Total Petugas"
          value={stats.users}
          icon={Users}
          iconClassName="bg-green-100 text-green-600"
          className="border-green-100"
          description="Satpam aktif"
        />
        <StatCard
          label="Total Riwayat"
          value={stats.patrols}
          icon={History}
          iconClassName="bg-purple-100 text-purple-600"
          className="border-purple-100"
          description="Total aktivitas patroli"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Statistik Keaktifan Petugas
            </h2>
            <PatrolStatsChart data={patrolStatsByUser} />
          </div>
        </div>

        {/* Warning / Status Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Status Patroli Harian
            </h2>
            <UnpatrolledWarning />
          </div>
        </div>
      </div>
    </div>
  );
}
