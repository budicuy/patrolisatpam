import { desc } from "drizzle-orm";
import LocationForm from "@/components/admin/LocationForm";
import LocationList from "@/components/admin/LocationList";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const allLocations = await db
    .select()
    .from(locations)
    .orderBy(desc(locations.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Lokasi</h2>
      </div>

      {/* Form Section (includes Map) */}
      <LocationForm />

      {/* List Section */}
      <LocationList locations={allLocations} />
    </div>
  );
}
