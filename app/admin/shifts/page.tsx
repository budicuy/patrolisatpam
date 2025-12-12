import { desc } from "drizzle-orm";
import ShiftForm from "@/components/admin/ShiftForm";
import ShiftList from "@/components/admin/ShiftList";
import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";

export const dynamic = "force-dynamic"; // Ensure fresh data on every request

export default async function ShiftsPage() {
  const allShifts = await db.select().from(shifts).orderBy(desc(shifts.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Manajemen Shift Jaga
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Form Section */}
        <ShiftForm />

        {/* List Section */}
        <ShiftList shifts={allShifts} />
      </div>
    </div>
  );
}
