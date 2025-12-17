"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patrolHistory } from "@/lib/schema";

export async function checkInPatrol(
  userId: string,
  shiftId: string,
  locationId: string,
  status: "aman" | "tidak_aman" = "aman",
  notes?: string,
  imageData?: string,
) {
  try {
    await db.insert(patrolHistory).values({
      userId,
      shiftId,
      locationId,
      checkInTime: new Date(),
      status,
      notes,
      imageData,
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
  logs: {
    locationId: string;
    checkInTime: Date;
    status: "aman" | "tidak_aman";
    notes?: string;
    imageData?: string;
  }[],
) {
  try {
    if (!logs || logs.length === 0) {
      throw new Error("Data patroli kosong.");
    }

    const values = logs.map((log) => ({
      userId,
      shiftId,
      locationId: log.locationId,
      checkInTime: log.checkInTime,
      status: log.status,
      notes: log.notes,
      imageData: log.imageData, // base64 string
    }));

    await db.insert(patrolHistory).values(values);

    revalidatePath("/patrol");
    return { success: true };
  } catch (error) {
    console.error("Submit patrol report failed", error);
    return { error: "Gagal menyimpan laporan patroli." };
  }
}
