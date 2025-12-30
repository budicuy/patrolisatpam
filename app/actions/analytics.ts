"use server";

import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { patrolHistory, shifts, users, locations } from "@/lib/schema";
import { TOTAL_ROUNDS } from "@/lib/constants";
import {
    startOfMonth,
    endOfMonth,
    eachWeekOfInterval,
    eachMonthOfInterval,
    format,
    startOfYear,
    endOfYear,
    endOfWeek,
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

    if (years.length === 0) {
        return [new Date().getFullYear()];
    }

    return years;
}

// === OPTIMIZED: Daily Stats using SQL GROUP BY ===
export async function getDailyPatrolStats(year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const result = await db
        .select({
            day: sql<number>`EXTRACT(DAY FROM ${patrolHistory.checkInTime})::int`.as("day"),
            count: count(patrolHistory.id),
        })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .groupBy(sql`EXTRACT(DAY FROM ${patrolHistory.checkInTime})`)
        .orderBy(sql`EXTRACT(DAY FROM ${patrolHistory.checkInTime})`);

    // Build complete days array with zeros for missing days
    const daysInMonth = endDate.getDate();
    const dataMap = new Map(result.map((r) => [r.day, Number(r.count)]));

    return Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        value: dataMap.get(i + 1) || 0,
        date: format(new Date(year, month - 1, i + 1), "yyyy-MM-dd"),
    }));
}

// === OPTIMIZED: Weekly Stats using SQL GROUP BY ===
export async function getWeeklyPatrolStats(year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });

    const result = await db
        .select({
            week: sql<number>`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})::int`.as("week"),
            count: count(patrolHistory.id),
        })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .groupBy(sql`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})`)
        .orderBy(sql`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})`);

    const dataMap = new Map(result.map((r) => [r.week, Number(r.count)]));

    return weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const actualEnd = weekEnd > endDate ? endDate : weekEnd;
        const actualStart = weekStart < startDate ? startDate : weekStart;
        const weekNum = parseInt(format(weekStart, "w"));

        return {
            label: `${format(actualStart, "d MMM", { locale: id })} - ${format(actualEnd, "d MMM", { locale: id })}`,
            value: dataMap.get(weekNum) || 0,
            date: format(weekStart, "yyyy-MM-dd"),
        };
    });
}

// === OPTIMIZED: Monthly Stats using SQL GROUP BY ===
export async function getMonthlyPatrolStats(year: number) {
    const startDate = startOfYear(new Date(year, 0));
    const endDate = endOfYear(new Date(year, 0));

    const result = await db
        .select({
            month: sql<number>`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})::int`.as("month"),
            count: count(patrolHistory.id),
        })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .groupBy(sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`)
        .orderBy(sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`);

    const dataMap = new Map(result.map((r) => [r.month, Number(r.count)]));
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map((monthStart, idx) => ({
        label: format(monthStart, "MMM", { locale: id }),
        value: dataMap.get(idx + 1) || 0,
        date: format(monthStart, "yyyy-MM"),
    }));
}

// === OPTIMIZED: Safe/Unsafe Stats based on actual status field ===
export async function getSafeUnsafeStats(year: number) {
    const startDate = startOfYear(new Date(year, 0));
    const endDate = endOfYear(new Date(year, 0));

    // Count patrols by month and status directly from database
    const result = await db
        .select({
            month: sql<number>`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})::int`.as("month"),
            status: patrolHistory.status,
            count: count(patrolHistory.id),
        })
        .from(patrolHistory)
        .where(
            and(
                gte(patrolHistory.checkInTime, startDate),
                lte(patrolHistory.checkInTime, endDate)
            )
        )
        .groupBy(
            sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`,
            patrolHistory.status
        );

    // Aggregate counts per month
    const monthStats = new Map<number, { safe: number; unsafe: number }>();

    for (const row of result) {
        const month = row.month;
        if (!monthStats.has(month)) {
            monthStats.set(month, { safe: 0, unsafe: 0 });
        }
        const stats = monthStats.get(month)!;

        if (row.status === "aman") {
            stats.safe = Number(row.count);
        } else if (row.status === "tidak_aman") {
            stats.unsafe = Number(row.count);
        }
    }

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map((monthStart, idx) => {
        const stats = monthStats.get(idx + 1) || { safe: 0, unsafe: 0 };
        return {
            label: format(monthStart, "MMM", { locale: id }),
            safe: stats.safe,
            unsafe: stats.unsafe,
            date: format(monthStart, "yyyy-MM"),
        };
    });
}

// === COMBINED: Get All Dashboard Data in Single Call ===
export async function getAllDashboardData(year: number, month: number) {
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    const yearStart = startOfYear(new Date(year, 0));
    const yearEnd = endOfYear(new Date(year, 0));

    // Run all queries in parallel
    const [dailyResult, weeklyResult, monthlyResult, safeUnsafeResult, userStatsResult] = await Promise.all([
        // Daily stats
        db.select({
            day: sql<number>`EXTRACT(DAY FROM ${patrolHistory.checkInTime})::int`.as("day"),
            count: count(patrolHistory.id),
        })
            .from(patrolHistory)
            .where(and(gte(patrolHistory.checkInTime, monthStart), lte(patrolHistory.checkInTime, monthEnd)))
            .groupBy(sql`EXTRACT(DAY FROM ${patrolHistory.checkInTime})`)
            .orderBy(sql`EXTRACT(DAY FROM ${patrolHistory.checkInTime})`),

        // Weekly stats
        db.select({
            week: sql<number>`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})::int`.as("week"),
            count: count(patrolHistory.id),
        })
            .from(patrolHistory)
            .where(and(gte(patrolHistory.checkInTime, monthStart), lte(patrolHistory.checkInTime, monthEnd)))
            .groupBy(sql`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})`)
            .orderBy(sql`EXTRACT(WEEK FROM ${patrolHistory.checkInTime})`),

        // Monthly stats
        db.select({
            month: sql<number>`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})::int`.as("month"),
            count: count(patrolHistory.id),
        })
            .from(patrolHistory)
            .where(and(gte(patrolHistory.checkInTime, yearStart), lte(patrolHistory.checkInTime, yearEnd)))
            .groupBy(sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`)
            .orderBy(sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`),

        // Safe/Unsafe stats
        db.select({
            month: sql<number>`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})::int`.as("month"),
            status: patrolHistory.status,
            count: count(patrolHistory.id),
        })
            .from(patrolHistory)
            .where(and(gte(patrolHistory.checkInTime, yearStart), lte(patrolHistory.checkInTime, yearEnd)))
            .groupBy(sql`EXTRACT(MONTH FROM ${patrolHistory.checkInTime})`, patrolHistory.status),

        // User stats
        db.select({
            userId: patrolHistory.userId,
            name: users.name,
            count: count(patrolHistory.id),
        })
            .from(patrolHistory)
            .leftJoin(users, eq(patrolHistory.userId, users.id))
            .where(and(gte(patrolHistory.checkInTime, monthStart), lte(patrolHistory.checkInTime, monthEnd)))
            .groupBy(patrolHistory.userId, users.name)
            .orderBy(sql`count(${patrolHistory.id}) DESC`),
    ]);

    // Process daily data
    const daysInMonth = monthEnd.getDate();
    const dailyMap = new Map(dailyResult.map((r) => [r.day, Number(r.count)]));
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
        label: String(i + 1),
        value: dailyMap.get(i + 1) || 0,
        date: format(new Date(year, month - 1, i + 1), "yyyy-MM-dd"),
    }));

    // Process weekly data
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const weeklyMap = new Map(weeklyResult.map((r) => [r.week, Number(r.count)]));
    const weekly = weeks.map((weekStart) => {
        const weekEnd2 = endOfWeek(weekStart, { weekStartsOn: 1 });
        const actualEnd = weekEnd2 > monthEnd ? monthEnd : weekEnd2;
        const actualStart = weekStart < monthStart ? monthStart : weekStart;
        const weekNum = parseInt(format(weekStart, "w"));
        return {
            label: `${format(actualStart, "d MMM", { locale: id })} - ${format(actualEnd, "d MMM", { locale: id })}`,
            value: weeklyMap.get(weekNum) || 0,
            date: format(weekStart, "yyyy-MM-dd"),
        };
    });

    // Process monthly data
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    const monthlyMap = new Map(monthlyResult.map((r) => [r.month, Number(r.count)]));
    const monthly = months.map((m, idx) => ({
        label: format(m, "MMM", { locale: id }),
        value: monthlyMap.get(idx + 1) || 0,
        date: format(m, "yyyy-MM"),
    }));

    // Process safe/unsafe data
    const monthStats = new Map<number, { safe: number; unsafe: number }>();
    for (const row of safeUnsafeResult) {
        const m = row.month;
        if (!monthStats.has(m)) {
            monthStats.set(m, { safe: 0, unsafe: 0 });
        }
        const stats = monthStats.get(m)!;
        if (row.status === "aman") {
            stats.safe = Number(row.count);
        } else if (row.status === "tidak_aman") {
            stats.unsafe = Number(row.count);
        }
    }
    const safeUnsafe = months.map((m, idx) => {
        const stats = monthStats.get(idx + 1) || { safe: 0, unsafe: 0 };
        return {
            label: format(m, "MMM", { locale: id }),
            safe: stats.safe,
            unsafe: stats.unsafe,
            date: format(m, "yyyy-MM"),
        };
    });

    // Process user stats
    const userStats = userStatsResult.map((row) => ({
        name: row.name || "Unknown",
        patrols: Number(row.count),
    }));

    return { daily, weekly, monthly, safeUnsafe, userStats };
}

// === Patrol Stats by User (already optimized with GROUP BY) ===
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
