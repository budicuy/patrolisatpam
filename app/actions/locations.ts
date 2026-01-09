"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { locations, patrolHistory } from "@/lib/schema";

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

// Cached version of locations query - revalidates every 5 hours or on tag invalidation
const getCachedLocations = unstable_cache(
  async () => {
    return await db.select().from(locations).orderBy(locations.order);
  },
  ["locations-data"],
  {
    revalidate: 18000, // 5 hours
    tags: ["locations"],
  }
);

export async function getLocations() {
  // This can be accessed by logged-in users (satpam needs it for patrol)
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please login first");
  }
  // Use cached version
  return await getCachedLocations();
}

export async function createLocation(formData: FormData) {
  // Auth check - only admin can create locations
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const name = formData.get("name") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const radius = parseInt(formData.get("radius") as string, 10) || 5;
  const order = parseInt(formData.get("order") as string, 10);

  const existing = await db.query.locations.findFirst({
    where: eq(locations.order, order),
  });

  if (existing) {
    return { error: "Urutan patroli sudah digunakan oleh lokasi lain." };
  }

  await db.insert(locations).values({
    name,
    latitude,
    longitude,
    radius,
    order,
  });

  // Invalidate locations cache
  revalidateTag("locations", "max");
  revalidatePath("/admin/locations");
  return { success: true };
}

export async function deleteLocation(id: number) {
  try {
    // Auth check - only admin can delete locations
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return { error: authCheck.error };
    }

    await db.transaction(async (tx) => {
      // Delete associated patrol history first to satisfy foreign key constraints
      await tx.delete(patrolHistory).where(eq(patrolHistory.locationId, id));
      // Then delete the location
      await tx.delete(locations).where(eq(locations.id, id));
    });

    // Invalidate locations cache
    revalidateTag("locations", "max");
    revalidatePath("/admin/locations");
    return { success: true };
  } catch (error) {
    console.error("Delete location error:", error);
    return { error: "Gagal menghapus lokasi." };
  }
}

export async function updateLocation(id: number, formData: FormData) {
  // Auth check - only admin can update locations
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) {
    return { error: authCheck.error };
  }

  const name = formData.get("name") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const radius = parseInt(formData.get("radius") as string, 10) || 5;
  const order = parseInt(formData.get("order") as string, 10);

  const existing = await db.query.locations.findFirst({
    where: (locations, { and, ne, eq }) =>
      and(eq(locations.order, order), ne(locations.id, id)),
  });

  if (existing) {
    return { error: "Urutan patroli sudah digunakan oleh lokasi lain." };
  }

  await db
    .update(locations)
    .set({
      name,
      latitude,
      longitude,
      radius,
      order,
    })
    .where(eq(locations.id, id));

  // Invalidate locations cache
  revalidateTag("locations", "max");
  revalidatePath("/admin/locations");
  return { success: true };
}

