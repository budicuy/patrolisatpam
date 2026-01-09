"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { patrolHistory, shifts } from "@/lib/schema";

// Extended user type for session
interface ExtendedUser {
  id?: string;
  role?: string;
}

// Helper to check admin access
async function requireAdmin(): Promise<{
  authorized: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: "Unauthorized: Please login first" };
  }
  const user = session.user as ExtendedUser;
  if (user.role !== "admin") {
    return { authorized: false, error: "Unauthorized: Admin access required" };
  }
  return { authorized: true };
}

// Cached version of shifts query - revalidates every 5 hours or on tag invalidation
const getCachedShifts = unstable_cache(
  async () => {
    return await db.select().from(shifts);
  },
  ["shifts-data"],
  {
    revalidate: 18000, // 5 hours
    tags: ["shifts"],
  }
);

export async function getShifts() {
  // This can be accessed by logged-in users (satpam needs it for patrol)
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please login first");
  }
  // Use cached version
  return await getCachedShifts();
}

export async function createShift(formData: FormData) {
  try {
    // Auth check - only admin can create shifts
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    const name = formData.get("name") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    if (!name || !startTime || !endTime) {
      return { error: "Semua field harus diisi" };
    }

    await db.insert(shifts).values({
      name,
      startTime: startTime,
      endTime: endTime,
    });

    // Invalidate shifts cache
    revalidateTag("shifts", "max");
    revalidatePath("/admin/shifts");
    return { success: true };
  } catch (error) {
    console.error("Create shift error:", error);
    return { error: "Gagal membuat shift" };
  }
}

export async function deleteShift(id: number) {
  try {
    // Auth check - only admin can delete shifts
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    await db.transaction(async (tx) => {
      // Delete associated patrol history first
      await tx.delete(patrolHistory).where(eq(patrolHistory.shiftId, id));
      // Then delete the shift
      await tx.delete(shifts).where(eq(shifts.id, id));
    });

    // Invalidate shifts cache
    revalidateTag("shifts", "max");
    revalidatePath("/admin/shifts");
    return { success: true };
  } catch (error) {
    console.error("Delete shift error:", error);
    return { error: "Gagal menghapus shift" };
  }
}

