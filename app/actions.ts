"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { encrypt, verifySession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  locations,
  patrolLogs,
  patrolSessions,
  shifts,
  users,
} from "@/lib/db/schema";

// Helper type for action state
export type ActionState = {
  error?: string;
  success?: boolean;
};

// --- Auth Helpers (New) ---

async function getUser(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username),
  });
}

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const user = await getUser(username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { error: "Username atau password salah." };
  }

  const session = await encrypt({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sameSite: "lax",
    path: "/",
  });

  if (user.role === "admin") {
    redirect("/admin/dashboard");
  } else {
    redirect("/patrol");
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function createLocation(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const latParam = formData.get("lat");
  const lngParam = formData.get("lng");
  const radius = formData.get("radius") as string;

  if (!name || !latParam || !lngParam) {
    return { error: "Nama dan lokasi wajib diisi." };
  }

  const lat = typeof latParam === "string" ? latParam : latParam.toString();
  const lng = typeof lngParam === "string" ? lngParam : lngParam.toString();

  try {
    await db.insert(locations).values({
      name,
      // Drizzle decimal columns are typically strings to preserve precision
      // but if the schema expects numbers, we can use parseFloat.
      // However, to be safe and match the schema definition which might map to string for decimal,
      // let's cast or pass string if that was working.
      // Actually, standard Drizzle usage for decimal is string.
      latitude: lat,
      longitude: lng,
      radius: parseInt(radius, 10) || 5,
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Gagal menyimpan lokasi." };
  }
}

export async function deleteLocation(id: number) {
  await db.delete(locations).where(eq(locations.id, id));
  return { success: true };
}

export async function createShift(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;

  if (!name || !startTime || !endTime) {
    return { error: "Semua field harus diisi" };
  }

  await db.insert(shifts).values({
    name,
    startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
    endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
  });

  return { success: true };
}

export async function deleteShift(id: number) {
  await db.delete(shifts).where(eq(shifts.id, id));
  return { success: true };
}

// -- Patrol Actions --

export async function startPatrolSession() {
  const { isAuth, userId } = await verifySession();
  if (!isAuth || !userId) return { error: "Unauthorized" };

  await db.insert(patrolSessions).values({
    userId: userId,
    date: new Date(), // Drizzle expects Date object
    startTime: new Date().toLocaleTimeString("id-ID", { hour12: false }),
    status: "ongoing",
  });

  return { success: true };
}

export async function finishPatrolSession(sessionId: number) {
  await db
    .update(patrolSessions)
    .set({
      endTime: new Date().toLocaleTimeString("id-ID", { hour12: false }),
      status: "completed",
    })
    .where(eq(patrolSessions.id, sessionId));

  return { success: true };
}

export async function checkInLocation(sessionId: number, locationId: number) {
  // Validate if already checked in?
  const existing = await db.query.patrolLogs.findFirst({
    where: (logs) =>
      and(eq(logs.sessionId, sessionId), eq(logs.locationId, locationId)),
  });

  if (existing) return { error: "Sudah absen di lokasi ini." };

  await db.insert(patrolLogs).values({
    sessionId,
    locationId,
    status: "checked_in",
  });

  return { success: true };
}

export async function getPatrolState() {
  const { isAuth, userId } = await verifySession();
  if (!isAuth || !userId) return null;

  // Get active session
  const session = await db.query.patrolSessions.findFirst({
    where: (s) => and(eq(s.userId, userId), eq(s.status, "ongoing")),
    with: {
      logs: true,
    },
  });

  // Get all locations
  const allLocations = await db
    .select()
    .from(locations)
    .orderBy(locations.sequenceOrder);

  return { session, locations: allLocations };
}
