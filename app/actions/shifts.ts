"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patrolHistory, shifts } from "@/lib/schema";

export async function getShifts() {
  return await db.select().from(shifts);
}

export async function createShift(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (!name || !startTime || !endTime) {
      return { error: "Semua field harus diisi" };
    }

    await db.insert(shifts).values({
      name,
      startTime: startTime,
      endTime: endTime,
    });

    revalidatePath("/admin/shifts");
    return { success: true };
  } catch (error) {
    console.error("Create shift error:", error);
    return { error: "Gagal membuat shift" };
  }
}

export async function deleteShift(id: number) {
  try {
    await db.transaction(async (tx) => {
      // Delete associated patrol history first
      await tx.delete(patrolHistory).where(eq(patrolHistory.shiftId, id));
      // Then delete the shift
      await tx.delete(shifts).where(eq(shifts.id, id));
    });
    revalidatePath("/admin/shifts");
    return { success: true };
  } catch (error) {
    console.error("Delete shift error:", error);
    return { error: "Gagal menghapus shift" };
  }
}
