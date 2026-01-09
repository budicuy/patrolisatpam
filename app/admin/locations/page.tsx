import { getLocations } from "@/app/actions/locations";
import { auth } from "@/lib/auth";
import LocationForm from "./_components/location-form";
import LocationList from "./_components/location-list";

interface ExtendedUser {
  role?: string;
}

export default async function LocationsPage() {
  const locations = await getLocations();
  const session = await auth();
  const currentUserRole = (session?.user as ExtendedUser)?.role || "satpam";
  const isHR = currentUserRole === "hr";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-sans">Kelola Lokasi Gedung</h1>
      </div>

      <div className={`grid grid-cols-1 gap-8 ${isHR ? "" : "lg:grid-cols-3"}`}>
        <div className={isHR ? "" : "lg:col-span-2"}>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Daftar Lokasi</h2>
            <LocationList
              initialLocations={locations}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>

        {!isHR && (
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">Tambah Lokasi Baru</h2>
              <LocationForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
