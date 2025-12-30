"use server";

import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { patrolHistory, shifts, users, locations } from "@/lib/schema";
import { TOTAL_ROUNDS } from "@/lib/constants";
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    format,
    getWeek,
    startOfYear,
    endOfYear,
} from "date-fns";
import { id } from "date-fns/locale";

// === Get Available Years from Database ===
export async function getAvailableYears(): Promise<number[]> {
    const result = await db
        .select({
            year: sql<number>`EXTRACT(YEAR FROM ${patrolHistory.checkInTime})::int`.as("year"),
        })
        .from(patrolHistory)
        .groupBy(sql`EXTRACT(YEAR FROM ${patrolHistory.checkInTime})`)
        .orderBy(sql`EXTRACT(YEAR FROM ${patrolHistory.checkInTime}) DESC`);

    const years = result.map((r) => r.year).filter(Boolean);

    // If no data, return current year as default
    if (years.length === 0) {
        return [new Date().getFullYear()];
    }

    return years;
}

// === Daily Stats (by month) ===
export async function getDailyPatrolStats(year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const patrols = await db
        .select({ checkInTime: patrolHistory.checkInTime })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        );

    return days.map((day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const count = patrols.filter((p) => {
            const checkDate = new Date(p.checkInTime);
            return checkDate >= dayStart && checkDate <= dayEnd;
        }).length;

        return {
            label: format(day, "d"),
            value: count,
            date: format(day, "yyyy-MM-dd"),
        };
    });
}

// === Weekly Stats (by month - 4-5 weeks) ===
export async function getWeeklyPatrolStats(year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });

    const patrols = await db
        .select({ checkInTime: patrolHistory.checkInTime })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        );

    return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const actualEnd = weekEnd > endDate ? endDate : weekEnd;
        const actualStart = weekStart < startDate ? startDate : weekStart;

        const count = patrols.filter((p) => {
            const checkDate = new Date(p.checkInTime);
            return checkDate >= actualStart && checkDate <= actualEnd;
        }).length;

        return {
            label: `${format(actualStart, "d MMM", { locale: id })} - ${format(actualEnd, "d MMM", { locale: id })}`,
            value: count,
            date: format(weekStart, "yyyy-MM-dd"),
        };
    });
}

// === Monthly Stats (by year - 12 months) ===
export async function getMonthlyPatrolStats(year: number) {
    const startDate = startOfYear(new Date(year, 0));
    const endDate = endOfYear(new Date(year, 0));
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const patrols = await db
        .select({ checkInTime: patrolHistory.checkInTime })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        );

    return months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);

        const count = patrols.filter((p) => {
            const checkDate = new Date(p.checkInTime);
            return checkDate >= monthStart && checkDate <= monthEnd;
        }).length;

        return {
            label: format(monthStart, "MMM", { locale: id }),
            value: count,
            date: format(monthStart, "yyyy-MM"),
        };
    });
}

// === Safe/Unsafe Stats (by year - 12 months) ===
export async function getSafeUnsafeStats(year: number) {
    const startDate = startOfYear(new Date(year, 0));
    const endDate = endOfYear(new Date(year, 0));
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const allShifts = await db.select().from(shifts);
    const [locationCount] = await db.select({ value: count() }).from(locations);
    const totalLocations = locationCount.value;
    const requiredPatrolsPerShift = totalLocations * TOTAL_ROUNDS;

    const patrols = await db
        .select({
            checkInTime: patrolHistory.checkInTime,
            shiftId: patrolHistory.shiftId,
        })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        );

    return months.map((monthStart) => {
        const monthEnd = endOfMonth(monthStart);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        let safeCount = 0;
        let unsafeCount = 0;

        for (const day of daysInMonth) {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            for (const shift of allShifts) {
                const shiftPatrols = patrols.filter((p) => {
                    const checkDate = new Date(p.checkInTime);
                    return (
                        checkDate >= dayStart &&
                        checkDate <= dayEnd &&
                        p.shiftId === shift.id
                    );
                }).length;

                if (shiftPatrols >= requiredPatrolsPerShift) {
                    safeCount++;
                } else if (shiftPatrols > 0) {
                    unsafeCount++;
                }
            }
        }

        return {
            label: format(monthStart, "MMM", { locale: id }),
            safe: safeCount,
            unsafe: unsafeCount,
            date: format(monthStart, "yyyy-MM"),
        };
    });
}

// === Patrol Stats by User (with month/year filter) ===
export async function getPatrolStatsByUserFiltered(year: number, month?: number) {
    const startDate = month
        ? startOfMonth(new Date(year, month - 1))
        : startOfYear(new Date(year, 0));
    const endDate = month
        ? endOfMonth(new Date(year, month - 1))
        : endOfYear(new Date(year, 0));

    const result = await db
        .select({
            userId: patrolHistory.userId,
            name: users.name,
            count: count(patrolHistory.id),
        })
        .from(patrolHistory)
        .leftJoin(users, eq(patrolHistory.userId, users.id))
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .groupBy(patrolHistory.userId, users.name)
        .orderBy(sql`count(${patrolHistory.id}) DESC`);

    return result.map((row) => ({
        name: row.name || "Unknown",
        patrols: Number(row.count),
    }));
}

// === Export Data ===
export async function getPatrolExportData(year: number, month?: number) {
    const startDate = month
        ? startOfMonth(new Date(year, month - 1))
        : startOfYear(new Date(year, 0));
    const endDate = month
        ? endOfMonth(new Date(year, month - 1))
        : endOfYear(new Date(year, 0));

    const data = await db
        .select({
            id: patrolHistory.id,
            checkInTime: patrolHistory.checkInTime,
            roundNumber: patrolHistory.roundNumber,
            userName: users.name,
            shiftName: shifts.name,
            locationName: locations.name,
        })
        .from(patrolHistory)
        .leftJoin(users, eq(patrolHistory.userId, users.id))
        .leftJoin(shifts, eq(patrolHistory.shiftId, shifts.id))
        .leftJoin(locations, eq(patrolHistory.locationId, locations.id))
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .orderBy(patrolHistory.checkInTime);

    return data.map((row) => ({
        id: row.id,
        tanggal: format(new Date(row.checkInTime), "yyyy-MM-dd"),
        waktu: format(new Date(row.checkInTime), "HH:mm:ss"),
        petugas: row.userName || "-",
        shift: row.shiftName || "-",
        lokasi: row.locationName || "-",
        putaran: row.roundNumber,
    }));
}
