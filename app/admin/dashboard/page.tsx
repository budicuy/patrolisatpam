import { count } from "drizzle-orm";
import { History, MapPin, Users } from "lucide-react";
import { db } from "@/lib/db";
import { locations, patrolHistory, users } from "@/lib/schema";

async function getStats() {
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Dashboard Admin</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card Locations */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Lokasi
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.locations}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Users */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Petugas
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.users}
              </h3>
            </div>
          </div>
        </div>

        {/* Card Patrols */}
        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-md dark:bg-gray-800 transition-all hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Patroli
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.patrols}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Aktivitas Terbaru
        </h2>
        <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
          <p className="text-gray-500 text-sm italic">
            Belum ada aktivitas patroli terbaru.
          </p>
        </div>
      </div>
    </div>
  );
}
