"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { locations, patrolHistory } from "@/lib/schema";

export async function getLocations() {
  return await db.select().from(locations).orderBy(locations.order);
}

export async function createLocation(formData: FormData) {
  const name = formData.get("name") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const radius = parseInt(formData.get("radius") as string) || 5;
  const order = parseInt(formData.get("order") as string);

  await db.insert(locations).values({
    name,
    latitude,
    longitude,
    radius,
    order,
  });

  revalidatePath("/admin/locations");
}

export async function deleteLocation(id: string) {
  await db.transaction(async (tx) => {
    // Delete associated patrol history first to satisfy foreign key constraints
    await tx.delete(patrolHistory).where(eq(patrolHistory.locationId, id));
    // Then delete the location
    await tx.delete(locations).where(eq(locations.id, id));
  });
  revalidatePath("/admin/locations");
}

export async function updateLocation(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const latitude = parseFloat(formData.get("latitude") as string);
  const longitude = parseFloat(formData.get("longitude") as string);
  const radius = parseInt(formData.get("radius") as string) || 5;
  const order = parseInt(formData.get("order") as string);

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

  revalidatePath("/admin/locations");
}
