"use server";

import { desc, eq } from "drizzle-orm";
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
    })
    .from(patrolHistory)
    .leftJoin(users, eq(patrolHistory.userId, users.id))
    .leftJoin(locations, eq(patrolHistory.locationId, locations.id))
    .leftJoin(shifts, eq(patrolHistory.shiftId, shifts.id))
    .orderBy(desc(patrolHistory.checkInTime));

  return history;
}
