"use server";

import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { locations, patrolHistory, shifts, users } from "@/lib/schema";

export async function getPatrolStatsByUser() {
  const stats = await db
    .select({
      userId: patrolHistory.userId,
      userName: users.name,
      patrolCount: count(patrolHistory.id),
    })
    .from(patrolHistory)
    .leftJoin(users, eq(patrolHistory.userId, users.id))
    .groupBy(patrolHistory.userId, users.name)
    .orderBy(desc(count(patrolHistory.id)));

  return stats.map((s) => ({
    name: s.userName || "Unknown",
    patrols: s.patrolCount,
  }));
}

export async function getUnpatrolledLocations(dateString: string) {
  // WITA is UTC+8
  const TIMEZONE_OFFSET_HOURS = 8;

  // Parse date string (YYYY-MM-DD) as WITA date
  const [year, month, day] = dateString.split("-").map(Number);

  // Create start of day in WITA (00:00:00 WITA = 16:00:00 UTC previous day)
  // and end of day in WITA (23:59:59 WITA = 15:59:59 UTC same day)
  const startOfDayUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  startOfDayUTC.setUTCHours(
    startOfDayUTC.getUTCHours() - TIMEZONE_OFFSET_HOURS,
  );

  const endOfDayUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - TIMEZONE_OFFSET_HOURS);

  // Get all locations
  const allLocations = await db
    .select({
      id: locations.id,
      name: locations.name,
      order: locations.order,
    })
    .from(locations)
    .orderBy(locations.order);

  // Get all shifts
  const allShifts = await db
    .select({
      id: shifts.id,
      name: shifts.name,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
    })
    .from(shifts);

  // Get all patrol logs for this date with their shift info
  const patrolLogs = await db
    .select({
      locationId: patrolHistory.locationId,
      shiftId: patrolHistory.shiftId,
    })
    .from(patrolHistory)
    .where(
      and(
        gte(patrolHistory.checkInTime, startOfDayUTC),
        lt(patrolHistory.checkInTime, endOfDayUTC),
      ),
    );

  // Group patrolled locations by shift
  const patrolledByShift: Record<number, Set<number>> = {};
  for (const log of patrolLogs) {
    if (log.shiftId) {
      if (!patrolledByShift[log.shiftId]) {
        patrolledByShift[log.shiftId] = new Set();
      }
      patrolledByShift[log.shiftId].add(log.locationId);
    }
  }

  // Build result: for each shift, list unpatrolled locations
  const result = allShifts.map((shift) => {
    const patrolledIds = patrolledByShift[shift.id] || new Set();
    const unpatrolled = allLocations.filter((loc) => !patrolledIds.has(loc.id));

    return {
      shift: {
        id: shift.id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
      },
      unpatrolledLocations: unpatrolled,
      totalLocations: allLocations.length,
      patrolledCount: patrolledIds.size,
    };
  });

  return result;
}
