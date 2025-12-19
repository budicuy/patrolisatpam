"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { locations, patrolHistory, shifts, users } from "@/lib/schema";

export const getPatrolHistory = async ({
  page = 1,
  limit = 9,
  date,
  shiftId,
}: {
  page?: number;
  limit?: number;
  date?: string;
  shiftId?: string;
}) => {
  try {
    const offset = (page - 1) * limit;

    // Build conditional WHERE clause
    const conditions = [];
    if (date) {
      conditions.push(sql`DATE(${patrolHistory.checkInTime}) = ${date}`);
    }
    if (shiftId && shiftId !== "all") {
      conditions.push(sql`${patrolHistory.shiftId} = ${shiftId}`);
    }

    const whereSql =
      conditions.length > 0
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``;

    // 1. Get Distinct Groups (Shift per Date) with Pagination & Filtering
    const groupsQuery = sql`
      SELECT DISTINCT 
        DATE(${patrolHistory.checkInTime}) as "date",
        ${patrolHistory.shiftId} as "shift_id"
      FROM ${patrolHistory}
      ${whereSql}
      ORDER BY "date" DESC, "shift_id" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const groupsResult = await db.execute(groupsQuery);
    // @ts-expect-error
    const groups = groupsResult as unknown as {
      date: string;
      shift_id: string;
    }[];

    if (groups.length === 0) {
      return {
        data: [],
        metadata: {
          currentPage: page,
          totalPages: 0,
          totalGroups: 0,
        },
      };
    }

    // 2. Fetch all logs belonging to these groups
    // Construct "OR" condition for (date = d1 AND shift = s1) OR (date = d2 AND shift = s2) ...
    const groupConditions = groups.map(
      (g) =>
        sql`(DATE(${patrolHistory.checkInTime}) = ${g.date} AND ${patrolHistory.shiftId} = ${g.shift_id})`,
    );

    const data = await db
      .select({
        id: patrolHistory.id,
        checkInTime: patrolHistory.checkInTime,
        userId: users.id,
        userName: users.name,
        locationName: locations.name,
        shiftId: shifts.id,
        shiftName: shifts.name,
        status: patrolHistory.status,
        notes: patrolHistory.notes,
        imageData: patrolHistory.imageData,
      })
      .from(patrolHistory)
      .leftJoin(users, eq(patrolHistory.userId, users.id))
      .leftJoin(locations, eq(patrolHistory.locationId, locations.id))
      .leftJoin(shifts, eq(patrolHistory.shiftId, shifts.id))
      .where(sql.join(groupConditions, sql` OR `))
      .orderBy(desc(patrolHistory.checkInTime));

    // 3. Count total groups for pagination metadata matching the filter
    const countQuery = sql`
      SELECT COUNT(DISTINCT (DATE(${patrolHistory.checkInTime}), ${patrolHistory.shiftId})) as "count"
      FROM ${patrolHistory}
      ${whereSql}
    `;

    const countResult = await db.execute(countQuery);
    // @ts-expect-error
    const totalGroups = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalGroups / limit);

    return {
      data,
      metadata: {
        currentPage: page,
        totalPages,
        totalGroups,
      },
    };
  } catch (error) {
    console.error("Error fetching patrol history:", error);
    return {
      data: [],
      metadata: { currentPage: 1, totalPages: 1, totalGroups: 0 },
    };
  }
};

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

export async function getShifts() {
  try {
    const allShifts = await db.select().from(shifts);
    return allShifts;
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return [];
  }
}
