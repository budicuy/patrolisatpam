import { count } from "drizzle-orm";
import { History, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { locations, patrolHistory, users } from "@/lib/schema";
import { StatCard } from "./_components/stat-card";
import { DashboardClient } from "./_components/dashboard-client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

async function getStats() {
  // Run all count queries in parallel for better performance
  const [[locationCount], [userCount], [patrolCount]] = await Promise.all([
    db.select({ value: count() }).from(locations),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(patrolHistory),
  ]);

  return {
    locations: locationCount.value,
    users: userCount.value,
    patrols: patrolCount.value,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const today = new Date();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview status patroli satpam hari ini, {format(today, "EEEE, d MMMM yyyy", { locale: id })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Dashboard Client (Filters + Charts) */}
      <DashboardClient />
    </div>
  );
}
