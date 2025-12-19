import { count } from "drizzle-orm";
import { History, MapPin, Users } from "lucide-react";
import { getPatrolStatsByUser } from "@/app/actions/stats";
import { db } from "@/lib/db";
import { locations, patrolHistory, users } from "@/lib/schema";
import { PatrolStatsChart } from "./_components/patrol-stats-chart";
import { UnpatrolledWarning } from "./_components/unpatrolled-warning";

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Dashboard Admin</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card Locations */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Lokasi</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.locations}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Users */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Petugas</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.users}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Patrols */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <History className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Patroli</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.patrols}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Patrol Statistics Chart */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Statistik Patroli per Petugas
        </h2>
        <div className="rounded-xl bg-white p-6 shadow-md">
          <PatrolStatsChart data={patrolStatsByUser} />
        </div>
      </div>

      {/* Unpatrolled Locations Warning */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Status Patroli Lokasi
        </h2>
        <div className="rounded-xl bg-white p-6 shadow-md">
          <UnpatrolledWarning />
        </div>
      </div>
    </div>
  );
}
