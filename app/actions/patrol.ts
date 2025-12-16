"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patrolHistory } from "@/lib/schema";

export async function checkInPatrol(
  userId: string,
  shiftId: string,
  locationId: string,
) {
  try {
    await db.insert(patrolHistory).values({
      userId,
      shiftId,
      locationId,
      checkInTime: new Date(),
    });

    revalidatePath("/patrol");
    return { success: true };
  } catch (error) {
    console.error("Check in failed", error);
    throw new Error("Gagal check in");
  }
}

export async function submitPatrolReport(
  userId: string,
  shiftId: string,
  logs: { locationId: string; checkInTime: Date }[],
) {
  try {
    if (!logs || logs.length === 0) {
      throw new Error("Data patroli kosong.");
    }

    const values = logs.map((log) => ({
      userId,
      shiftId,
      locationId: log.locationId,
      checkInTime: log.checkInTime, // Using client provided time, or could allow server override if needed, but client captured time is more accurate for "when they checked in" locally
    }));

    await db.insert(patrolHistory).values(values);

    revalidatePath("/patrol");
    return { success: true };
  } catch (error) {
    console.error("Submit patrol report failed", error);
    return { error: "Gagal menyimpan laporan patroli." };
  }
}
