"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { locations, patrolHistory, shifts, users } from "@/lib/schema";

export async function getPatrolHistory() {
  const history = await db
    .select({
      id: patrolHistory.id,
      checkInTime: patrolHistory.checkInTime,
      userId: users.id,
      userName: users.name,
      locationName: locations.name,
      shiftName: shifts.name,
      status: patrolHistory.status,
      notes: patrolHistory.notes,
      imageData: patrolHistory.imageData,
    })
    .from(patrolHistory)
    .leftJoin(users, eq(patrolHistory.userId, users.id))
    .leftJoin(locations, eq(patrolHistory.locationId, locations.id))
    .leftJoin(shifts, eq(patrolHistory.shiftId, shifts.id))
    .orderBy(desc(patrolHistory.checkInTime));

  return history;
}

export async function deletePatrolLog(id: string) {
  try {
    await db.delete(patrolHistory).where(eq(patrolHistory.id, id));
    revalidatePath("/admin/history");
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Gagal menghapus data." };
  }
}

export async function updatePatrolLog(
  id: string,
  data: { status: "aman" | "tidak_aman"; notes?: string },
) {
  try {
    await db.update(patrolHistory).set(data).where(eq(patrolHistory.id, id));
    revalidatePath("/admin/history");
    return { success: true };
  } catch (error) {
    console.error("Update error:", error);
    return { error: "Gagal mengupdate data." };
  }
}
