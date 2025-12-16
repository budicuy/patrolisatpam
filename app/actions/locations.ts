"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { locations } from "@/lib/schema";

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
  await db.delete(locations).where(eq(locations.id, id));
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
