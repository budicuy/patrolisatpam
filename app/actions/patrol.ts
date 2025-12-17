"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { patrolHistory, shifts } from "@/lib/schema";
import { and, eq, gte, lte, desc, sql } from "drizzle-orm";

// TIMEZONE CONFIGURATION
// Indonesia Central Time (WITA) is UTC+8
const TIMEZONE_OFFSET_HOURS = 8;
const TIMEZONE_OFFSET_MS = TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;

// Helper to determine active shift window in specific timezone (WITA)
function getShiftWindow(shift: { startTime: string; endTime: string }, now: Date = new Date()) {
  // 1. Get current time in WITA components
  // We use UTC methods on a shifted date object to extract "local" components
  const nowWita = new Date(now.getTime() + TIMEZONE_OFFSET_MS);
  const currentAuthorsYear = nowWita.getUTCFullYear();
  const currentAuthorsMonth = nowWita.getUTCMonth();
  const currentAuthorsDate = nowWita.getUTCDate();
  const currentAuthorsHours = nowWita.getUTCHours();
  const currentAuthorsMinutes = nowWita.getUTCMinutes();

  const [startHour, startMinute] = shift.startTime.split(":").map(Number);
  const [endHour, endMinute] = shift.endTime.split(":").map(Number);

  // 2. Construct Start/End times in WITA context
  // Initially assume they are on the "current WITA day"
  let startWitaTimestamp = Date.UTC(currentAuthorsYear, currentAuthorsMonth, currentAuthorsDate, startHour, startMinute, 0, 0);
  let endWitaTimestamp = Date.UTC(currentAuthorsYear, currentAuthorsMonth, currentAuthorsDate, endHour, endMinute, 59, 999);

  // 3. Handle Overnight Shifts and Day Boundaries
  // Logic: Find the closest "valid" shift window relative to NOW.
  if (startHour > endHour) {
    // Overnight Shift (e.g., 23:00 - 07:00)

    // If currently in the morning (e.g., 05:00), the shift started yesterday
    if (currentAuthorsHours < endHour || (currentAuthorsHours === endHour && currentAuthorsMinutes <= endMinute)) {
      startWitaTimestamp -= 24 * 60 * 60 * 1000; // Start was yesterday
    } else {
      // If currently in the evening (e.g., 23:30), the shift ends tomorrow
      endWitaTimestamp += 24 * 60 * 60 * 1000; // End is tomorrow
    }
  }

  // 4. Convert back to absolute UTC for DB queries
  const start = new Date(startWitaTimestamp - TIMEZONE_OFFSET_MS);
  const end = new Date(endWitaTimestamp - TIMEZONE_OFFSET_MS);

  return { start, end };
}

export async function getPatrolProgress(shiftId: string) {
  try {
    const shift = await db.query.shifts.findFirst({
      where: eq(shifts.id, shiftId),
    });

    if (!shift) return { visitedLocationIds: [] };

    // Use current server time, but logic inside handles WITA adjustment
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

    // 2. Validate Time (Shift Locking) with WITA
    const now = new Date();
    const { start, end } = getShiftWindow({ startTime: shift.startTime, endTime: shift.endTime }, now);

    if (now < start || now > end) {
      throw new Error("Waktu patroli untuk shift ini sudah habis atau belum dimulai (Zona Waktu WITA).");
    }

    // 3. Insert Log
    await db.insert(patrolHistory).values({
      userId,
      shiftId,
      locationId,
      checkInTime: now, // Store absolute UTC
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

export async function getActiveShiftId(shiftsData: { id: string; startTime: string; endTime: string }[]) {
  const now = new Date();

  for (const shift of shiftsData) {
    const { start, end } = getShiftWindow(shift, now);

    // Check if NOW is within the window (Inclusive Start, Exclusive End)
    if (now.getTime() >= start.getTime() && now.getTime() < end.getTime()) {
      return shift.id;
    }
  }

  return null;
}
