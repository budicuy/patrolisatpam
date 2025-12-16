"use server";

import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { patrolHistory } from "@/lib/schema";

export async function getPatrolHistory() {
  return await db.query.patrolHistory.findMany({
    with: {
      user: true,
      location: true,
      shift: true,
    },
    orderBy: [desc(patrolHistory.checkInTime)],
  });
}
