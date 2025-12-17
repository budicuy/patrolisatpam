"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patrolHistory, shifts } from "@/lib/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

// Helper to determine active shift window
function getShiftWindow(shift: { startTime: string; endTime: string }, now: Date = new Date()) {
  const [startHour, startMinute] = shift.startTime.split(":").map(Number);
  const [endHour, endMinute] = shift.endTime.split(":").map(Number);

  const start = new Date(now);
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(now);
  end.setHours(endHour, endMinute, 59, 999);

  // Handle overnight shifts (e.g. 22:00 - 06:00)
  if (startHour > endHour) {
    // If we are currently in the "morning" part (00:00 - 06:00), the shift started yesterday
    if (now.getHours() < endHour || (now.getHours() === endHour && now.getMinutes() <= endMinute)) {
        start.setDate(start.getDate() - 1);
    } else {
        // If we are in the "evening" part (22:00 - 23:59), the shift ends tomorrow
        end.setDate(end.getDate() + 1);
    }
  }

  return { start, end };
}

export async function getPatrolProgress(shiftId: string) {
  try {
    const shift = await db.query.shifts.findFirst({
      where: eq(shifts.id, shiftId),
    });

    if (!shift) return { visitedLocationIds: [] };

    const { start, end } = getShiftWindow({ startTime: shift.startTime, endTime: shift.endTime });

    const logs = await db
      .select({ locationId: patrolHistory.locationId })
      .from(patrolHistory)
      .where(
        and(
          eq(patrolHistory.shiftId, shiftId),
          gte(patrolHistory.checkInTime, start),
          lte(patrolHistory.checkInTime, end)
        )
      );

    return { visitedLocationIds: logs.map(l => l.locationId) };
  } catch (error) {
    console.error("Failed to get patrol progress", error);
    return { visitedLocationIds: [] };
  }
}

export async function checkInPatrol(
  userId: string,
  shiftId: string,
  locationId: string,
  status: "aman" | "tidak_aman" = "aman",
  notes?: string,
  imageData?: string,
) {
  try {
    // 1. Get Shift Details
    const shift = await db.query.shifts.findFirst({
        where: eq(shifts.id, shiftId),
    });

    if (!shift) throw new Error("Shift tidak ditemukan");

    // 2. Validate Time (Shift Locking)
    const { start, end } = getShiftWindow({ startTime: shift.startTime, endTime: shift.endTime });
    const now = new Date();

    if (now < start || now > end) {
        throw new Error("Waktu patroli untuk shift ini sudah habis atau belum dimulai.");
    }

    // 3. Check if already checked in (Optional: prevent double check-in for same location in same shift session? 
    // User didn't explicitly forbid re-check, but implies 'completion'. Let's allow update or ignore dups to be safe, 
    // but typically we just insert a new log. Let's stick to insert.)

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
  } catch (error: any) {
    console.error("Check in failed", error);
    return { error: error.message || "Gagal check in" };
  }
}
