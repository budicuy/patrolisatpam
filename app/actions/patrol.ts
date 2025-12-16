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
