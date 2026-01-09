import { getShifts } from "@/app/actions/shifts";
import { auth } from "@/lib/auth";
import { ShiftForm } from "./_components/shift-form";
import { ShiftList } from "./_components/shift-list";

interface ExtendedUser {
  role?: string;
}

export default async function ShiftsPage() {
  const shifts = await getShifts();
  const session = await auth();
  const currentUserRole = (session?.user as ExtendedUser)?.role || "satpam";
  const isHR = currentUserRole === "hr";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-sans">Kelola Shift Jaga</h1>

      <div className={`grid grid-cols-1 gap-8 ${isHR ? "" : "lg:grid-cols-3"}`}>
        {/* Form - hidden for HR */}
        {!isHR && (
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">Tambah Shift Baru</h2>
              <ShiftForm />
            </div>
          </div>
        )}

        {/* List */}
        <div className={isHR ? "" : "lg:col-span-2"}>
          <div className="rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Daftar Shift</h2>
            <ShiftList
              initialShifts={shifts}
              currentUserRole={currentUserRole}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
